from flask import Blueprint, jsonify, request
from src.models.user import Course, Purchase, User, db
from src.routes.auth import token_required
import stripe
import os

payments_bp = Blueprint('payments', __name__)

# Stripe configuration (in production, use environment variables)
stripe.api_key = "sk_test_your_stripe_secret_key_here"  # Replace with actual key
STRIPE_PUBLISHABLE_KEY = "pk_test_your_stripe_publishable_key_here"  # Replace with actual key

@payments_bp.route('/stripe-config', methods=['GET'])
def get_stripe_config():
    """Get Stripe publishable key for frontend"""
    return jsonify({'publishable_key': STRIPE_PUBLISHABLE_KEY})

@payments_bp.route('/create-payment-intent', methods=['POST'])
@token_required
def create_payment_intent(current_user):
    """Create Stripe payment intent for course purchase"""
    data = request.json
    course_id = data.get('course_id')
    
    if not course_id:
        return jsonify({'message': 'Course ID is required'}), 400
    
    course = Course.query.get_or_404(course_id)
    
    # Check if user already purchased this course
    existing_purchase = Purchase.query.filter_by(
        user_id=current_user.id,
        course_id=course_id,
        status='completed'
    ).first()
    
    if existing_purchase:
        return jsonify({'message': 'You have already purchased this course'}), 400
    
    try:
        # Create payment intent with Stripe
        intent = stripe.PaymentIntent.create(
            amount=int(course.price * 100),  # Amount in cents
            currency='usd',
            metadata={
                'user_id': current_user.id,
                'course_id': course_id,
                'course_title': course.title
            }
        )
        
        return jsonify({
            'client_secret': intent.client_secret,
            'amount': course.price,
            'course_title': course.title
        })
        
    except stripe.error.StripeError as e:
        return jsonify({'message': f'Payment error: {str(e)}'}), 400

@payments_bp.route('/confirm-payment', methods=['POST'])
@token_required
def confirm_payment(current_user):
    """Confirm payment and create purchase record"""
    data = request.json
    payment_intent_id = data.get('payment_intent_id')
    course_id = data.get('course_id')
    
    if not payment_intent_id or not course_id:
        return jsonify({'message': 'Payment intent ID and course ID are required'}), 400
    
    try:
        # Retrieve payment intent from Stripe
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if intent.status != 'succeeded':
            return jsonify({'message': 'Payment not completed'}), 400
        
        course = Course.query.get_or_404(course_id)
        
        # Check if purchase already exists
        existing_purchase = Purchase.query.filter_by(
            payment_id=payment_intent_id
        ).first()
        
        if existing_purchase:
            return jsonify({'message': 'Purchase already recorded'}), 400
        
        # Create purchase record
        purchase = Purchase(
            user_id=current_user.id,
            course_id=course_id,
            payment_id=payment_intent_id,
            amount_paid=intent.amount / 100,  # Convert from cents
            status='completed'
        )
        
        db.session.add(purchase)
        db.session.commit()
        
        return jsonify({
            'message': 'Purchase completed successfully',
            'purchase': purchase.to_dict()
        })
        
    except stripe.error.StripeError as e:
        return jsonify({'message': f'Payment verification error: {str(e)}'}), 400

@payments_bp.route('/my-purchases', methods=['GET'])
@token_required
def get_my_purchases(current_user):
    """Get all purchases for current user"""
    purchases = Purchase.query.filter_by(user_id=current_user.id).all()
    
    purchase_data = []
    for purchase in purchases:
        data = purchase.to_dict()
        data['course'] = purchase.course.to_dict()
        purchase_data.append(data)
    
    return jsonify(purchase_data)

@payments_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhooks for payment events"""
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    endpoint_secret = 'whsec_your_webhook_secret_here'  # Replace with actual webhook secret
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError:
        return jsonify({'message': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({'message': 'Invalid signature'}), 400
    
    # Handle payment_intent.succeeded event
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        
        # Update purchase status if needed
        purchase = Purchase.query.filter_by(
            payment_id=payment_intent['id']
        ).first()
        
        if purchase and purchase.status != 'completed':
            purchase.status = 'completed'
            db.session.commit()
    
    return jsonify({'status': 'success'})

# Demo payment route for testing without Stripe
@payments_bp.route('/demo-purchase', methods=['POST'])
@token_required
def demo_purchase(current_user):
    """Demo purchase endpoint for testing (remove in production)"""
    data = request.json
    course_id = data.get('course_id')
    
    if not course_id:
        return jsonify({'message': 'Course ID is required'}), 400
    
    course = Course.query.get_or_404(course_id)
    
    # Check if user already purchased this course
    existing_purchase = Purchase.query.filter_by(
        user_id=current_user.id,
        course_id=course_id,
        status='completed'
    ).first()
    
    if existing_purchase:
        return jsonify({'message': 'You have already purchased this course'}), 400
    
    # Create demo purchase
    purchase = Purchase(
        user_id=current_user.id,
        course_id=course_id,
        payment_id=f'demo_{current_user.id}_{course_id}',
        amount_paid=course.price,
        status='completed'
    )
    
    db.session.add(purchase)
    db.session.commit()
    
    return jsonify({
        'message': 'Demo purchase completed successfully',
        'purchase': purchase.to_dict()
    })

