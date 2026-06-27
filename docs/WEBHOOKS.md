# Velora Webhooks & Outbound Integrations

This reference details Velora's simulated and external notification webhook systems, message schemas, and outbound notification integrations.

---

## 1. Telegram Bot Webhook Simulation

Velora integrates an active mock-webhook handler to simulate incoming Telegram Bot API interactions. This allows the platform to process user queries, verify bot states, and maintain a reactive community announcements feed.

### Webhook Endpoint Specs
- **Route**: `POST /api/telegram/webhook`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
- **Request Body Payload (JSON)**:
  Matches the standard Telegram Bot API update payload specification:
  ```json
  {
    "update_id": 9821045,
    "message": {
      "message_id": 481,
      "from": {
        "id": 9104812,
        "is_bot": false,
        "first_name": "Alice",
        "username": "alice_pioneer"
      },
      "chat": {
        "id": 9104812,
        "first_name": "Alice",
        "type": "private"
      },
      "date": 1782562484,
      "text": "/status"
    }
  }
  ```

---

## 2. Bot Webhook Command Reference

The webhook parser identifies commands matching the `message.text` string and responds with custom reply formats.

### A. `/start` Command
- **Trigger**: Sent when a user initializes the bot.
- **Log Side-Effect**: Publishes a mock entry to the public `/api/telegram/feed` stream.
- **Webhook Response**:
  ```json
  {
    "reply": "🚀 *Velora Bot*: Hello @alice_pioneer! Welcome to the Cognitive Workspace Bot. Use /status to check top indicators or visit the waitlist panel."
  }
  ```

### B. `/status` Command
- **Trigger**: Queries platform status directly from active database tables.
- **Log Side-Effect**: Publishes a live status check announcement to the Telegram feed.
- **Webhook Response**:
  ```json
  {
    "reply": "📊 *Velora System Live Status*:\n\n🚀 Active Pioneers: 242\n🎯 Global tasks: 12\n✨ Multiplier: x1.0"
  }
  ```

---

## 3. Outbound Notification Integrations

Velora triggers outbound programmatic notifications on critical account transitions.

### A. Resend Email Dispatch
The backend utilizes the Resend email delivery service to process transactional, security, and verification emails using HTML templates styled with professional dark-mode brand guidelines.

1. **Email Types**:
   - **Verification Code**: Dispatched during registration (`POST /api/auth/register`). Contains a 6-digit confirmation card.
   - **Password Reset**: Dispatched upon reset requests (`POST /api/auth/reset-password-request`). Contains a secure 15-minute token code.
   - **Password Changed Alert**: Sent to confirm successful password updates, advising immediate action if not user-initiated.
   - **Token Claim Dispatched**: Dispatched upon claims (`POST /api/user/rewards/claim`). Includes conversion metadata, wallet info, and EVM block hash links.
   - **KYC Status Updates**: Sent on administrator KYC approval or rejection, with clear steps for next actions.
   - **Admin Campaign Newsletter**: Sent via email campaigns dispatcher (`POST /api/admin/email-campaign`).

2. **Database Traceability**:
   Admin users can audit all transactional emails dispatched by querying `GET /api/admin/sent-emails`.

---

### B. Telegram Group Channel Broadcaster
Whenever significant milestones occur, the platform calls an internal function `announceToTelegram()` to broadcast live metrics to the public `/api/telegram/feed` and log them within the app’s community sidebar:

- **Ecosystem Milestones**: Broadcasts whenever users register, verify KYC, complete high-value actions, or link Web3 wallets.
- **Broadcast Content**: Contains humanized, clean, and literal messages (e.g., `🌐 Web3 Pioneer: @alice successfully linked their metamask decentralized wallet address!`).
