# Velora Gamified Task & Streaks Engine

This document outlines the architecture, lifecycles, and verification mechanics of Velora's gamified waitlist tasks, achievements system, and daily streak multipliers.

---

## 1. Gamified Waitlist Task Categories

Velora divides challenges into five distinct task categories:

* **Daily Check-In**: A recurring daily check-in that awards points and tracks consecutive streaks.
* **Social Connections**: Verified checks confirming that the user has linked Web3 wallets or completed social tasks (Twitter, Website visits).
* **Telegram Verification**: Real-time validation checks for joining the community and announcements channels, awarding points upon completion.

```
       Task Types & Standard Base Point Values
+-------------------+-----------------------------------+
|     Task Type     |       Standard Base Reward        |
+-------------------+-----------------------------------+
| Daily Check-in    | +50 Base Points (Multipliers apply)|
| Link Web3 Wallet  | +250 Points                       |
| Email Verification| +150 Points                       |
| Telegram Channels | +100 Points per Channel           |
| Twitter Verification| +100 Points                      |
| Website Visit     | +50 Points                        |
+-------------------+-----------------------------------+
```

---

## 2. Dynamic Task State Machine

User tasks transition through three states:

```
+---------------+        User Clicks Link        +---------------+
|  NOT STARTED  | -----------------------------> |  IN PROGRESS  |
+---------------+                                +---------------+
                                                         |
                                                 Verifies Condition
                                                         |
                                                         v
                                                 +---------------+
                                                 |   COMPLETED   |
                                                 +---------------+
```

* **Not Started**: The task is registered globally but has no matching record in the `user_tasks` table for the user.
* **In Progress**: User has initiated the action (e.g. visited the social link or connected a Web3 wallet).
* **Completed / Claimed**: Relational entry established in the `user_tasks` table. The reward has been added to the user's ledger, and the action button displays "Claimed" on the frontend.

---

## 3. Daily Streaks & Multiplier Calculations

To drive engagement, Velora incentivizes daily check-ins with consecutive streak multipliers:

* **Streak Calculation**: When a user checks in, the system compares the timestamp with their `lastCheckIn` timestamp.
  * If the last check-in occurred within the previous UTC day, the streak increments by 1.
  * If more than 48 hours have elapsed, the streak resets to 1.
* **Point Multipliers**: Calculated dynamically based on the current streak:
  $$\text{Points Awarded} = \text{Base Points} \times (1.0 + (\text{Streak} \times 0.05))$$
* **Global Multiplier**: Admin settings can apply a global `pointMultiplier` (e.g., `x1.5` during special event campaigns) that stacks with streak multipliers.

---

## 4. Achievements & Badge Milestones

When a user completes milestones, the system unlocks persistent badges (written to `achievements` and tracked in `user.badges` as JSON arrays):

1. **Early Pioneer**: Awarded upon completing email verification.
2. **Web3 Explorer**: Awarded upon linking a Web3 wallet address.
3. **Streak Champion**: Awarded upon reaching a 7-day consecutive check-in streak.
4. **Verified Citizen**: Awarded when an administrator approves the user's KYC verification.

---

## 5. Administrative Task Management

Administrators can configure tasks directly from the admin panel:

* **Task Creation**: Add new social challenges, set point rewards, and configure verification links.
* **Task Modification**: Adjust titles, descriptions, and point allocations.
* **Soft Deletion**: Tasks are never permanently deleted from the database. Setting `is_deleted = true` hides tasks from user feeds while preserving historic completion records for analytics.
