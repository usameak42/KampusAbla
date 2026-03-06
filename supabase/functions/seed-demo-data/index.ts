import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const results: any = {};

  // 1. Create parent auth user
  const { data: parentAuth, error: parentAuthErr } = await supabaseAdmin.auth.admin.createUser({
    email: "parent@kampusabla.com",
    password: "TestParent123",
    email_confirm: true,
    user_metadata: { role: "parent", full_name: "Ayşe Demir" },
  });
  if (parentAuthErr) {
    results.parentAuthError = parentAuthErr.message;
  } else {
    results.parentUserId = parentAuth.user.id;
  }

  // 2. Create sitter auth user
  const { data: sitterAuth, error: sitterAuthErr } = await supabaseAdmin.auth.admin.createUser({
    email: "sitter@kampusabla.com",
    password: "TestSitter123",
    email_confirm: true,
    user_metadata: { role: "sitter", full_name: "Zeynep Yılmaz" },
  });
  if (sitterAuthErr) {
    results.sitterAuthError = sitterAuthErr.message;
  } else {
    results.sitterUserId = sitterAuth.user.id;
  }

  const parentId = results.parentUserId;
  const sitterId = results.sitterUserId;

  if (!parentId || !sitterId) {
    return new Response(JSON.stringify({ error: "Failed to create auth users", results }), { status: 400 });
  }

  // 3. Create parent profile
  const { error: parentErr } = await supabaseAdmin.from("parents").insert({
    user_id: parentId,
    full_name: "Ayşe Demir",
    phone: "+905551234567",
    district: "Kadıköy",
    address: "Caferağa Mah. Moda Cad. No:15, Kadıköy/İstanbul",
  });
  results.parentProfile = parentErr ? parentErr.message : "ok";

  // 4. Create sitter profile
  const { error: sitterErr } = await supabaseAdmin.from("sitters").insert({
    user_id: sitterId,
    full_name: "Zeynep Yılmaz",
    phone: "+905559876543",
    university: "Boğaziçi Üniversitesi",
    department: "Psikoloji",
    district: "Beşiktaş",
    age: 22,
    student_year: 3,
    year: 3,
    bio: "Boğaziçi Üniversitesi Psikoloji 3. sınıf öğrencisiyim. Çocuklarla çalışmayı çok seviyorum.",
    hourly_rate: 250,
    languages: ["Türkçe", "İngilizce"],
    is_available: true,
    verification_status: "pending",
    rating: 4.8,
    review_count: 0,
    gender: "female",
  });
  results.sitterProfile = sitterErr ? sitterErr.message : "ok";

  // Get sitter record ID for FK references
  const { data: sitterRecord } = await supabaseAdmin.from("sitters").select("id").eq("user_id", sitterId).single();
  const sitterRecordId = sitterRecord?.id;

  // 5. Create children for parent
  const { data: child1, error: child1Err } = await supabaseAdmin.from("children").insert({
    parent_id: parentId,
    name: "Elif Demir",
    birth_date: "2016-03-15",
    gender: "female",
    allergies: JSON.stringify(["Fıstık"]),
    notes: "Matematik ödev yardımı gerekiyor",
  }).select().single();
  results.child1 = child1Err ? child1Err.message : child1?.id;

  const { data: child2, error: child2Err } = await supabaseAdmin.from("children").insert({
    parent_id: parentId,
    name: "Can Demir",
    birth_date: "2018-07-22",
    gender: "male",
    notes: "İngilizce pratiği yapması iyi olur",
  }).select().single();
  results.child2 = child2Err ? child2Err.message : child2?.id;

  // 6. Create sitter verification (pending)
  if (sitterRecordId) {
    const { error: verErr } = await supabaseAdmin.from("sitter_verifications").insert({
      sitter_id: sitterRecordId,
      university_email: "zeynep.yilmaz@boun.edu.tr",
      verification_status: "pending",
      student_id_url: "https://placehold.co/400x300?text=Student+ID",
      government_id_url: "https://placehold.co/400x300?text=Government+ID",
      selfie_url: "https://placehold.co/400x300?text=Selfie",
    });
    results.verification = verErr ? verErr.message : "ok";
  }

  // 7. Create a booking
  const bookingDate = new Date();
  bookingDate.setDate(bookingDate.getDate() + 3);
  const { data: booking, error: bookingErr } = await supabaseAdmin.from("bookings").insert({
    parent_id: parentId,
    sitter_id: sitterId,
    booking_date: bookingDate.toISOString().split("T")[0],
    start_time: "14:00",
    duration_hours: 3,
    total_amount: 750,
    status: "confirmed",
    pickup_needed: true,
    meeting_address: "Moda İlkokulu, Kadıköy",
    notes: "Elif'i okuldan alıp eve getirecek, sonra ödev yardımı",
    confirmed_at: new Date().toISOString(),
    payment_status: "completed",
  }).select().single();
  results.booking = bookingErr ? bookingErr.message : booking?.id;

  // 8. Create a session for the booking
  if (booking?.id) {
    const { error: sessionErr } = await supabaseAdmin.from("sessions").insert({
      booking_id: booking.id,
      status: "pending",
    });
    results.session = sessionErr ? sessionErr.message : "ok";

    // 9. Create a transaction
    const { error: txErr } = await supabaseAdmin.from("transactions").insert({
      booking_id: booking.id,
      sitter_id: sitterId,
      amount: 750,
      platform_fee: 75,
      sitter_amount: 675,
      status: "completed",
      paid_at: new Date().toISOString(),
    });
    results.transaction = txErr ? txErr.message : "ok";

    // 10. Link children to booking
    if (child1?.id) {
      await supabaseAdmin.from("booking_children").insert({ booking_id: booking.id, child_id: child1.id });
    }
  }

  // 11. Create a need post
  const needDate = new Date();
  needDate.setDate(needDate.getDate() + 5);
  const { error: needErr } = await supabaseAdmin.from("need_posts").insert({
    parent_id: parentId,
    title: "Elif için okul çıkışı bakıcı aranıyor",
    description: "Pazartesi-Çarşamba okul çıkışında alıp eve getirecek, ödev yardımı yapacak bakıcı arıyorum.",
    needed_date: needDate.toISOString().split("T")[0],
    start_time: "15:00",
    duration_hours: 3,
    hourly_rate_min: 200,
    hourly_rate_max: 300,
    pickup_needed: true,
    homework_help: true,
    meeting_address: "Moda İlkokulu, Kadıköy",
    status: "open",
  });
  results.needPost = needErr ? needErr.message : "ok";

  // 12. Create notifications
  await supabaseAdmin.from("notifications").insert([
    {
      user_id: parentId,
      title: "Hoş Geldiniz!",
      message: "KampusAbla'ya hoş geldiniz. Çocuğunuz için güvenilir bakıcılar bulabilirsiniz.",
      type: "system",
    },
    {
      user_id: sitterId,
      title: "Profil Tamamlayın",
      message: "Doğrulama belgelerinizi yükleyerek profilinizi tamamlayın.",
      type: "verification",
    },
  ]);

  // 13. Create a support ticket
  await supabaseAdmin.from("support_tickets").insert({
    user_id: parentId,
    subject: "Ödeme hakkında soru",
    message: "İlk rezervasyonumda ödeme nasıl yapılıyor? Kredi kartı kabul ediyor musunuz?",
    category: "payment",
    status: "open",
  });

  // 14. Create notification preferences
  await supabaseAdmin.from("notification_preferences").insert([
    { user_id: parentId },
    { user_id: sitterId },
  ]);

  // 15. Create user settings
  await supabaseAdmin.from("user_settings").insert([
    { user_id: parentId, language: "tr", theme: "light" },
    { user_id: sitterId, language: "tr", theme: "light" },
  ]);

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
