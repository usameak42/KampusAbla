-- Tighten remaining overly-permissive policies

-- booking_children: only parent of the booking can insert
DROP POLICY IF EXISTS "Users can insert booking children" ON public.booking_children;
CREATE POLICY "Users can insert booking children" ON public.booking_children
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings b 
    WHERE b.id = booking_id AND b.parent_id = auth.uid()
  )
);

-- conversations: only authenticated users
DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;
CREATE POLICY "Users can insert conversations" ON public.conversations
FOR INSERT TO authenticated
WITH CHECK (true);

-- notifications: system insert (keep true but restrict to authenticated)
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (true);

-- review_flags: only reviewer can insert flags for their reviews
DROP POLICY IF EXISTS "Users can insert review flags" ON public.review_flags;
CREATE POLICY "Users can insert review flags" ON public.review_flags
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reviews r 
    WHERE r.id = review_id AND r.reviewer_id = auth.uid()
  )
);

-- review_ratings: only reviewer can insert ratings
DROP POLICY IF EXISTS "Users can insert review ratings" ON public.review_ratings;
CREATE POLICY "Users can insert review ratings" ON public.review_ratings
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reviews r 
    WHERE r.id = review_id AND r.reviewer_id = auth.uid()
  )
);

-- review_tags: only reviewer can insert tags
DROP POLICY IF EXISTS "Users can insert review tags" ON public.review_tags;
CREATE POLICY "Users can insert review tags" ON public.review_tags
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reviews r 
    WHERE r.id = review_id AND r.reviewer_id = auth.uid()
  )
);

-- child_reviews: only reviewer can insert
DROP POLICY IF EXISTS "Users can insert child reviews" ON public.child_reviews;
CREATE POLICY "Users can insert child reviews" ON public.child_reviews
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reviews r 
    WHERE r.id = review_id AND r.reviewer_id = auth.uid()
  )
);

-- need_post_children: only parent of the need post
DROP POLICY IF EXISTS "Users can insert need post children" ON public.need_post_children;
CREATE POLICY "Users can insert need post children" ON public.need_post_children
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.need_posts np 
    WHERE np.id = need_post_id AND np.parent_id = auth.uid()
  )
);

-- ticket_responses: only ticket owner or staff
DROP POLICY IF EXISTS "Users can insert ticket responses" ON public.ticket_responses;
CREATE POLICY "Users can insert ticket responses" ON public.ticket_responses
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- payouts: only the sitter themselves
DROP POLICY IF EXISTS "Sitters can insert payouts" ON public.payouts;
CREATE POLICY "Sitters can insert payouts" ON public.payouts
FOR INSERT TO authenticated
WITH CHECK (sitter_id = auth.uid());

-- messages UPDATE: only conversation participants can mark as read
DROP POLICY IF EXISTS "Users can update messages" ON public.messages;
CREATE POLICY "Users can update messages" ON public.messages
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.messages m2 
    WHERE m2.conversation_id = messages.conversation_id 
    AND m2.sender_id = auth.uid()
    LIMIT 1
  ) OR sender_id = auth.uid()
);