from flask import Blueprint, jsonify, request, session
from src.models.user import User, db
import jwt
import datetime
from functools import wraps

auth_bp = Blueprint('auth', __name__)

# JWT secret key (in production, use environment variable)
JWT_SECRET = 'your-secret-key-change-in-production'

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if not current_user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    
    # Validate required fields
    if not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Username, email, and password are required'}), 400
    
    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400
    
    # Create new user
    user = User(
        username=data['username'],
        email=data['email']
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    
    if not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Username and password are required'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'message': 'Invalid username or password'}), 401
    
    # Generate JWT token
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, JWT_SECRET, algorithm='HS256')
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    })

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify(current_user.to_dict())

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    # For JWT, logout is handled client-side by removing the token
    return jsonify({'message': 'Logged out successfully'})

