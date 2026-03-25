from flask import Blueprint, jsonify, request, send_file
from src.models.user import Course, Video, Purchase, VideoProgress, User, db
from src.routes.auth import token_required, admin_required
import os
from werkzeug.utils import secure_filename

courses_bp = Blueprint('courses', __name__)

# Video upload configuration
UPLOAD_FOLDER = '/home/ubuntu/elearning-platform/uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@courses_bp.route('/courses', methods=['GET'])
def get_courses():
    """Get all active courses (public endpoint)"""
    courses = Course.query.filter_by(is_active=True).all()
    return jsonify([course.to_dict() for course in courses])

@courses_bp.route('/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    """Get course details (public endpoint)"""
    course = Course.query.get_or_404(course_id)
    if not course.is_active:
        return jsonify({'message': 'Course not found'}), 404
    
    course_data = course.to_dict()
    course_data['videos'] = [video.to_dict() for video in course.videos]
    return jsonify(course_data)

@courses_bp.route('/courses', methods=['POST'])
@token_required
@admin_required
def create_course(current_user):
    """Create a new course (admin only)"""
    data = request.json
    
    if not data.get('title') or not data.get('price'):
        return jsonify({'message': 'Title and price are required'}), 400
    
    course = Course(
        title=data['title'],
        description=data.get('description', ''),
        price=float(data['price'])
    )
    
    db.session.add(course)
    db.session.commit()
    
    return jsonify(course.to_dict()), 201

@courses_bp.route('/courses/<int:course_id>', methods=['PUT'])
@token_required
@admin_required
def update_course(current_user, course_id):
    """Update course (admin only)"""
    course = Course.query.get_or_404(course_id)
    data = request.json
    
    course.title = data.get('title', course.title)
    course.description = data.get('description', course.description)
    course.price = float(data.get('price', course.price))
    course.is_active = data.get('is_active', course.is_active)
    
    db.session.commit()
    return jsonify(course.to_dict())

@courses_bp.route('/courses/<int:course_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_course(current_user, course_id):
    """Delete course (admin only)"""
    course = Course.query.get_or_404(course_id)
    db.session.delete(course)
    db.session.commit()
    return '', 204

@courses_bp.route('/courses/<int:course_id>/videos', methods=['POST'])
@token_required
@admin_required
def upload_video(current_user, course_id):
    """Upload video to course (admin only)"""
    course = Course.query.get_or_404(course_id)
    
    if 'video' not in request.files:
        return jsonify({'message': 'No video file provided'}), 400
    
    file = request.files['video']
    if file.filename == '':
        return jsonify({'message': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'message': 'Invalid file type'}), 400
    
    # Create upload directory if it doesn't exist
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    # Secure filename and save
    filename = secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)
    
    # Create video record
    video = Video(
        title=request.form.get('title', filename),
        description=request.form.get('description', ''),
        filename=filename,
        course_id=course_id,
        order_index=int(request.form.get('order_index', 0))
    )
    
    db.session.add(video)
    db.session.commit()
    
    return jsonify(video.to_dict()), 201

@courses_bp.route('/courses/<int:course_id>/videos/<int:video_id>', methods=['PUT'])
@token_required
@admin_required
def update_video(current_user, course_id, video_id):
    """Update video details (admin only)"""
    video = Video.query.filter_by(id=video_id, course_id=course_id).first_or_404()
    data = request.json
    
    video.title = data.get('title', video.title)
    video.description = data.get('description', video.description)
    video.order_index = data.get('order_index', video.order_index)
    
    db.session.commit()
    return jsonify(video.to_dict())

@courses_bp.route('/courses/<int:course_id>/videos/<int:video_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_video(current_user, course_id, video_id):
    """Delete video (admin only)"""
    video = Video.query.filter_by(id=video_id, course_id=course_id).first_or_404()
    
    # Delete file from filesystem
    file_path = os.path.join(UPLOAD_FOLDER, video.filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    
    db.session.delete(video)
    db.session.commit()
    return '', 204

@courses_bp.route('/my-courses', methods=['GET'])
@token_required
def get_my_courses(current_user):
    """Get courses purchased by current user"""
    purchases = Purchase.query.filter_by(user_id=current_user.id, status='completed').all()
    courses = []
    
    for purchase in purchases:
        course_data = purchase.course.to_dict()
        course_data['purchased_at'] = purchase.purchased_at.isoformat()
        course_data['videos'] = [video.to_dict() for video in purchase.course.videos]
        courses.append(course_data)
    
    return jsonify(courses)

@courses_bp.route('/courses/<int:course_id>/check-access', methods=['GET'])
@token_required
def check_course_access(current_user, course_id):
    """Check if user has access to course"""
    purchase = Purchase.query.filter_by(
        user_id=current_user.id,
        course_id=course_id,
        status='completed'
    ).first()
    
    return jsonify({'has_access': purchase is not None})

@courses_bp.route('/videos/<int:video_id>/stream', methods=['GET'])
@token_required
def stream_video(current_user, video_id):
    """Stream video (requires course purchase)"""
    video = Video.query.get_or_404(video_id)
    
    # Check if user has purchased the course
    purchase = Purchase.query.filter_by(
        user_id=current_user.id,
        course_id=video.course_id,
        status='completed'
    ).first()
    
    if not purchase:
        return jsonify({'message': 'Access denied. Please purchase the course first.'}), 403
    
    file_path = os.path.join(UPLOAD_FOLDER, video.filename)
    if not os.path.exists(file_path):
        return jsonify({'message': 'Video file not found'}), 404
    
    return send_file(file_path)

@courses_bp.route('/videos/<int:video_id>/progress', methods=['POST'])
@token_required
def update_video_progress(current_user, video_id):
    """Update user's video watching progress"""
    video = Video.query.get_or_404(video_id)
    data = request.json
    
    # Check if user has access to the course
    purchase = Purchase.query.filter_by(
        user_id=current_user.id,
        course_id=video.course_id,
        status='completed'
    ).first()
    
    if not purchase:
        return jsonify({'message': 'Access denied'}), 403
    
    # Update or create progress record
    progress = VideoProgress.query.filter_by(
        user_id=current_user.id,
        video_id=video_id
    ).first()
    
    if not progress:
        progress = VideoProgress(
            user_id=current_user.id,
            video_id=video_id
        )
        db.session.add(progress)
    
    progress.progress_seconds = data.get('progress_seconds', 0)
    progress.completed = data.get('completed', False)
    
    db.session.commit()
    return jsonify(progress.to_dict())

@courses_bp.route('/videos/<int:video_id>/progress', methods=['GET'])
@token_required
def get_video_progress(current_user, video_id):
    """Get user's video watching progress"""
    progress = VideoProgress.query.filter_by(
        user_id=current_user.id,
        video_id=video_id
    ).first()
    
    if not progress:
        return jsonify({
            'progress_seconds': 0,
            'completed': False
        })
    
    return jsonify(progress.to_dict())

