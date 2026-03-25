# PayFast Payment Integration Setup Guide

**For Complete Beginners - Step-by-Step Instructions**

---

## What is PayFast?

PayFast is a South African payment gateway (like a digital cash register) that lets your customers pay for courses using:
- Credit/Debit cards
- Instant EFT (bank transfer)
- SnapScan
- Zapper
- And more!

Think of it as the "middleman" that safely handles money between your customers and your bank account.

---

## How Payment Works on Your Platform

Here's what happens when someone buys a course:

1. **Customer clicks "Buy Now"** on a course
2. **Your website creates an order** and redirects them to PayFast
3. **Customer pays on PayFast's secure page** (not your website)
4. **PayFast processes the payment** and tells your website "Payment successful!"
5. **Your website gives the customer access** to the course automatically

You don't handle any credit card details - PayFast does all the security work!

---

## Step 1: Create a PayFast Account

### Option A: Test Account (For Learning & Testing - FREE)

1. Go to https://sandbox.payfast.co.za/
2. Click "Register" in the top right
3. Fill in your details:
   - Email address
   - Password
   - Business name (can be anything for testing)
4. Verify your email
5. Log in to your PayFast Sandbox account

**Important:** The sandbox uses FAKE money. No real payments happen here!

### Option B: Live Account (For Real Payments)

1. Go to https://www.payfast.co.za/
2. Click "Sign Up" 
3. Choose your account type:
   - **Individual** - if you're a solo entrepreneur
   - **Business** - if you have a registered company
4. Fill in ALL required information:
   - Personal/Business details
   - Bank account information (where money will be deposited)
   - ID documents
5. Wait for PayFast to verify your account (usually 1-2 business days)

---

## Step 2: Get Your PayFast Credentials

Once logged into PayFast:

1. Click on **"Settings"** in the top menu
2. Click on **"Integration"** in the left sidebar
3. You'll see these important numbers:

   ```
   Merchant ID: 10000100
   Merchant Key: 46f0cd694581a
   Passphrase: (optional - you can set this)
   ```

**Write these down or keep the tab open!** You'll need them in the next step.

### What is a Passphrase?

A passphrase is like an extra password for security. It's optional but HIGHLY RECOMMENDED for live accounts.

To set one:
1. In the Integration settings
2. Scroll to "Security Passphrase"
3. Enter a strong password (mix of letters, numbers, symbols)
4. Click "Update"

---

## Step 3: Add PayFast Credentials to Your Website

Now we need to tell your website about your PayFast account.

### Using the Management UI (Easiest Way):

1. Open your AI Prompts Academy website
2. Click on the **Settings icon** (⚙️) in the top right
3. Go to **"Secrets"** tab
4. Click **"Add New Secret"**
5. Add these three secrets one by one:

   **Secret 1:**
   - Name: `PAYFAST_MERCHANT_ID`
   - Value: (paste your Merchant ID from PayFast)
   
   **Secret 2:**
   - Name: `PAYFAST_MERCHANT_KEY`
   - Value: (paste your Merchant Key from PayFast)
   
   **Secret 3:**
   - Name: `PAYFAST_PASSPHRASE`
   - Value: (paste your Passphrase if you set one, otherwise leave empty)

6. Click "Save" for each secret

**That's it!** Your website can now process payments through PayFast.

---

## Step 4: Test Your Payment System

### Testing with Sandbox (Fake Money):

1. Make sure you're using your SANDBOX credentials
2. Go to your website and try to buy a course
3. When redirected to PayFast, use these test card details:

   ```
   Card Number: 4000 0000 0000 0002
   Expiry Date: Any future date (e.g., 12/25)
   CVV: Any 3 digits (e.g., 123)
   ```

4. Complete the payment
5. You should be redirected back to your website
6. Check if you now have access to the course

### Testing with Live Account:

**WARNING:** Use a real card with a SMALL amount first (like R10) to test!

1. Switch to your LIVE credentials in the Secrets settings
2. Try buying a cheap course
3. Use your real card details
4. Check if:
   - Payment goes through
   - Money appears in your PayFast account
   - Customer gets access to the course

---

## Step 5: Understanding Payment Notifications (ITN)

PayFast sends your website a "notification" when a payment is successful. This is called ITN (Instant Transaction Notification).

**You don't need to do anything** - your website handles this automatically!

But here's what happens behind the scenes:
1. Customer pays on PayFast
2. PayFast sends a secret message to: `your-website.com/api/payment/notify`
3. Your website verifies the message is really from PayFast
4. Your website marks the purchase as "completed"
5. Customer gets access to the course

---

## Troubleshooting Common Issues

### Problem: "Payment failed" or "Invalid signature"

**Solution:**
- Double-check your Merchant ID and Merchant Key are correct
- Make sure there are no extra spaces when copying/pasting
- If using a passphrase, make sure it matches EXACTLY what's in PayFast

### Problem: Customer paid but didn't get access

**Solution:**
1. Check your PayFast dashboard - did the payment actually go through?
2. Look at your website's Admin Panel → Sales tab
3. Find the purchase - what's the status?
4. If status is "pending", PayFast might not have sent the notification yet (wait 5-10 minutes)

### Problem: Can't access Admin Panel

**Solution:**
- Only the website owner (you) can access `/admin`
- Make sure you're logged in with your account
- Your account should have "admin" role automatically

---

## Important Security Notes

### For Live Payments:

1. **ALWAYS use HTTPS** - your website URL should start with `https://`
2. **Set a strong passphrase** in PayFast settings
3. **Never share your Merchant Key** with anyone
4. **Check your PayFast account regularly** for suspicious activity

### For Sandbox Testing:

- Use ONLY sandbox credentials when testing
- Never use real card details in sandbox
- Switch to live credentials only when ready to accept real payments

---

## Payment Flow Diagram (Visual Guide)

```
Customer                    Your Website                PayFast
   |                             |                          |
   |  1. Clicks "Buy Now"        |                          |
   |--------------------------->|                          |
   |                             |                          |
   |                             | 2. Creates order         |
   |                             |    & payment data        |
   |                             |                          |
   |  3. Redirects to PayFast    |                          |
   |-------------------------------------------------->|
   |                             |                          |
   |  4. Enters card details     |                          |
   |                             |                          |
   |  5. Confirms payment        |                          |
   |                             |                          |
   |                             |  6. Payment notification |
   |                             |<-------------------------|
   |                             |                          |
   |                             | 7. Grants access         |
   |                             |                          |
   |  8. Redirected back         |                          |
   |<----------------------------|                          |
   |                             |                          |
   |  9. Can now access course   |                          |
```

---

## Frequently Asked Questions

### Q: How much does PayFast charge?

**A:** PayFast charges a small fee per transaction:
- **Standard:** 2.9% + R2.00 per transaction
- **Premium:** Lower rates for high volume (contact PayFast)

Example: If someone buys a R100 course, you receive R95.10 (R100 - R2.90 - R2.00)

### Q: When do I get paid?

**A:** PayFast pays out to your bank account:
- **Daily** - if you have a Premium account
- **Weekly** - for Standard accounts
- **Monthly** - for new accounts (first 3 months)

### Q: Can customers get refunds?

**A:** Yes! You can process refunds through your PayFast dashboard:
1. Log in to PayFast
2. Go to "Transactions"
3. Find the transaction
4. Click "Refund"
5. Enter the amount and reason

### Q: What if I want to change my prices?

**A:** Easy! Just:
1. Go to your Admin Panel
2. Click on "Courses"
3. Find the course
4. Click "Edit"
5. Change the price
6. Click "Save"

The new price applies immediately to new purchases.

### Q: Can I offer discounts or coupon codes?

**A:** The current system supports bundles (multiple courses at a discount). For individual coupon codes, you would need to add that feature (I can help with that later!).

---

## Next Steps After Setup

Once PayFast is working:

1. **Set your course prices** in the Admin Panel
2. **Create course bundles** for better value (already set up!)
3. **Test the complete purchase flow** yourself
4. **Share your website** with potential customers
5. **Monitor sales** in the Admin Panel

---

## Getting Help

If you run into issues:

1. **PayFast Support:**
   - Email: support@payfast.co.za
   - Phone: 087 820 7600
   - Help Center: https://payfast.io/help/

2. **Your Website Issues:**
   - Check the Admin Panel → Sales tab for purchase status
   - Look at the browser console for error messages (F12 key)
   - Ask me for help - I'm here to guide you!

---

## Summary Checklist

Before going live with real payments:

- [ ] PayFast account created and verified
- [ ] Bank account added to PayFast
- [ ] Merchant ID and Key added to website secrets
- [ ] Passphrase set and added to website
- [ ] Test purchase completed successfully in sandbox
- [ ] Test purchase completed with real card (small amount)
- [ ] Customer received access to course after payment
- [ ] Admin panel shows the purchase correctly
- [ ] Prices are set correctly for all courses
- [ ] Website is using HTTPS (secure)

---

**Congratulations!** 🎉 

You now have a fully functional payment system. Your customers can buy courses, and you'll automatically receive payments in your bank account!

Remember: Start with sandbox testing, then do a small real transaction, and only then open to the public.

---

*Last Updated: February 2026*
*For AI Prompts Academy Platform*
