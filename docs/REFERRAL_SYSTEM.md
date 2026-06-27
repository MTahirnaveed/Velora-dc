# Velora Multi-Tier Referral Engine Specification

This document details the mechanics, recursive points distribution logic, database relationships, and fraud-prevention controls governing Velora's 3-level viral referral system.

---

## 1. Core Referral Flow & Point Multipliers

Velora implements a high-leverage, 3-level recursive referral network. When a new user registers using a referral code, points are distributed up to three levels of referrers to incentivize viral sharing:

```
    [New User: Alice Registers]
               |
               v
  Level 1 Referral: Bob (Direct Referrer)  --------> Receives +250 Points
               |
               v
  Level 2 Referral: Charlie (Bob's Referrer) ------> Receives +100 Points
               |
               v
  Level 3 Referral: Dave (Charlie's Referrer) -----> Receives +50 Points
```

### Point Distribution Schedule
* **Direct Invite (Level 1)**: The direct referrer receives **+250 points**.
* **Tier-2 Invite (Level 2)**: The referrer's referrer receives **+100 points**.
* **Tier-3 Invite (Level 3)**: The next referrer in the chain receives **+50 points**.

---

## 2. Multi-Level Reward Distribution Sequence

The recursive reward algorithm is executed within a database transaction during registration (`POST /api/auth/register`):

```
       [Alice registers with Bob's Referral Code]
                           |
                           v
              Does Bob's username exist?
                        /     \
                     (No)     (Yes)
                      /         \
          Reject registration   Create Alice with referredBy: 'Bob'
                                Add Direct referral record
                                Allocate L1 points to Bob (+250)
                                         |
                                         v
                            Check if Bob has a referrer (Charlie)
                                        /     \
                                     (No)     (Yes)
                                      /         \
                              Terminates    Allocate L2 points to Charlie (+100)
                                            Add L2 referral record
                                                     |
                                                     v
                                        Check if Charlie has a referrer (Dave)
                                                    /     \
                                                 (No)     (Yes)
                                                  /         \
                                          Terminates    Allocate L3 points to Dave (+50)
                                                        Add L3 referral record
```

---

## 3. Database Schema Mapping

Three primary database tables manage referral relationships and point distributions:

### A. `users` Table
Tracks invitation handles and relationships.
* `username` (`text`, unique): Used as the referral handle.
* `referral_code` (`text`, unique): Short unique invite string (e.g. `VEL_A1B2`).
* `referred_by` (`text`): Stores the username of the direct referrer.
* `referrals_count` (`integer`): Incremented automatically for the direct referrer.

### B. `referrals` Table
Maintains referral records for tree traversals.
* `referrer_id` (`integer`): Direct referrer's user ID.
* `referee_id` (`integer`): Newly registered user's ID.
* `level` (`integer`): Referral tier (1, 2, or 3).
* `points_awarded` (`integer`): Point amount awarded for this invite.

### C. `referral_rewards` Table
Maintains transactional records tracking referral point allocations.
* `user_id` (`integer`): ID of user receiving points.
* `from_username` (`text`): Username of the newly registered user who triggered the reward.
* `level` (`integer`): Referral level.
* `points` (`integer`): Points allocated.

---

## 4. Fraud Prevention & System Constraints

To prevent gamification exploitation, Velora enforces strict system checks during registration:

1. **Self-Referral Prevention**: Registration fails with a `422 Unprocessable Entity` error if a user attempts to enter their own username or referral code in the referral field.
2. **Duplicate Code Matching**: If the provided referral code does not match an active user in the database, registration is rejected with an invalid referral error.
3. **Database Constraints**: The `referee_id` column in the `referrals` table contains a unique constraint, preventing a user from being referred multiple times.
