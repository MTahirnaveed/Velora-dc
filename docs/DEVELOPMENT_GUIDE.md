# Velora Application Development Guide

This manual is written for full-stack software engineers working on the Velora codebase. It describes the lifecycle, flow mechanics, and exact procedural guides for extending features, adding routes, modifying the schema, and implementing services.

---

## 1. Core Architecture & Request Flow

Velora runs a unified full-stack architecture. The client-side single-page app (React) and the REST API backend (Express) operate within a single Node process.

```
[React Frontend] (SPA Client)
       |
       |  HTTP Request (Header: Authorization Bearer JWT)
       v
[Express Router] (server.ts)
       |
       +--> Middleware: authenticateToken() (Decrypts JWT, verifies user, adds req.user)
       |
       +--> Middleware: checkRole('admin') (Conditional: Blocks non-admins with 403)
       |
       v
[Route Controller Handler] (server.ts / DB Queries)
       |
       +--> Call Parameterized DB Query (src/db/queries.ts)
       |
       v
[PostgreSQL Database] (Returns data safely)
       |
       v
[Controller Formats Response Envelope]
       |
       |  JSON Payload Response (e.g. 200 OK with data or 400 with error)
       v
[React UI Updates State] (Re-renders UI smoothly)
```

---

## 2. Standard State Management (React Client)

Velora operates with standard client-side state. The application avoids unnecessary overhead (like Redux or Zustand) by leveraging optimized state, contexts, and reactive triggers:

1. **Authentication State**: Loaded during the React bootstrap loop via `/api/auth/me`. If a valid JWT resides in `localStorage`, the user's profile is loaded into the `user` state, and the viewport switches to the authenticated Dashboard.
2. **Dynamic Polling & Syncing**: Check-in indicators, notification badges, active points tallies, and completed task arrays are refreshed dynamically whenever modal windows open, actions execute successfully, or check-ins trigger.
3. **Sound FX Context**: System audio is toggleable globally via user profile settings and played client-side on action clicks (check-ins, task claims).

---

## 3. How to Add a New Database Table

To introduce a new table to the Velora ecosystem, follow this exact sequence:

### Step 1: Define Table in `/src/db/schema.ts`
Add your pgTable declaration at the end of the schema file:
```typescript
export const communityPosts = pgTable('community_posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  likesCount: integer('likes_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Register relationships
export const communityPostsRelations = relations(communityPosts, ({ one }) => ({
  author: one(users, {
    fields: [communityPosts.userId],
    references: [users.id],
  }),
}));
```

### Step 2: Generate Migration Files
Compile your schema changes into standard SQL migration scripts:
```bash
npx drizzle-kit generate
```

### Step 3: Apply Database Migrations
Push the database structure updates directly into your active cluster:
```bash
npx drizzle-kit push
```

---

## 4. How to Add a New API Endpoint

After updating your schema, you can expose it via the REST API.

### Step 1: Add Database Query Methods (`src/db/queries.ts`)
Create parameterized methods to isolate data queries:
```typescript
export async function getCommunityPosts(dbInstance: any) {
  return dbInstance.select().from(communityPosts).orderBy(desc(communityPosts.createdAt));
}

export async function createCommunityPost(dbInstance: any, data: { userId: number; title: string; content: string }) {
  const [newPost] = await dbInstance.insert(communityPosts).values(data).returning();
  return newPost;
}
```

### Step 2: Register Routes and Middlewares in `server.ts`
Open `/server.ts` and declare your endpoints. Use the appropriate token guards to restrict access:
```typescript
import { getCommunityPosts, createCommunityPost } from './src/db/queries';

// GET /api/posts - Public or Standard User Feed
app.get("/api/posts", authenticateToken, async (req, res) => {
  try {
    const posts = await getCommunityPosts(db);
    res.json(posts);
  } catch (error) {
    console.error("Error fetching community posts:", error);
    res.status(500).json({ error: "Failed to retrieve posts." });
  }
});

// POST /api/posts - Authenticated Standard User Creation
app.post("/api/posts", authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required." });
    }
    const newPost = await createCommunityPost(db, {
      userId: req.user.id,
      title,
      content
    });
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error creating community post:", error);
    res.status(500).json({ error: "Failed to submit post." });
  }
});
```

---

## 5. How to Add a New Page / View in React (`src/App.tsx`)

To create an interactive section on the client-side UI:

1. **Register State Control**: If the view represents a specific structural component, add a state identifier to track active view states:
   ```typescript
   type ActiveView = 'dashboard' | 'tasks' | 'referrals' | 'admin' | 'settings' | 'community';
   const [activeView, setActiveView] = useState<ActiveView>('dashboard');
   ```
2. **Build Component Layout**: Craft a clean component layout, taking advantage of modern glassmorphism panels:
   ```typescript
   function CommunityView({ user }: { user: User }) {
     return (
       <div id="community_section" className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
         <h2 className="text-xl font-bold text-white mb-4">Pioneer Community Hub</h2>
         <p className="text-slate-400">Share updates, insights, and waitlist progress directly with other pioneers.</p>
       </div>
     );
   }
   ```
3. **Incorporate into View Switches**: Add the view to your client routing switch:
   ```typescript
   {activeView === 'community' && <CommunityView user={user} />}
   ```
4. **Update Sidebar/Navigation Elements**: Map a button click trigger in your navigation panel:
   ```typescript
   <button
     id="nav_community_btn"
     onClick={() => setActiveView('community')}
     className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
       activeView === 'community' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
     }`}
   >
     <MessageSquareIcon className="w-5 h-5" />
     <span>Community</span>
   </button>
   ```

---

## 6. Engineering Best Practices

* **Always Parameterize Queries**: Never concatenate inputs inside database transactions. Rely strictly on Drizzle's helper operations (`eq()`, `and()`, `or()`) which sanitize inputs automatically.
* **Keep Database Schemas Normalized**: Store primitive attributes in standard columns. Leverage `jsonb` columns strictly for complex datasets that don't participate in indexing or foreign relational keys (such as `user.badges`).
* **Handle Errors Gracefully**: Never crash the backend server on operational errors. Wrap route handlers in clean try/catch blocks, return standard `500 Internal Server Error` envelopes, and print the detailed stack trace to stdout logs.
* **Verify Types Early**: Keep `/src/types.ts` updated. Avoid using `any` across parameters or fields. Strict typing prevents runtime exceptions.
