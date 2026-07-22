


"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type SetReviewReplyInput = {
  bookingId: string;
  replied: boolean;
};

export async function setReviewReplyStatus({
  bookingId,
  replied,
}: SetReviewReplyInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile || !["admin", "desk"].includes(profile.role)) {
    throw new Error("Unauthorized");
  }

  if (replied) {
    const { error } = await supabase
      .from("review_replies")
      .upsert(
        {
          booking_id: bookingId,
          replied_by: user.id,
          replied_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "booking_id",
        }
      );

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase
      .from("review_replies")
      .delete()
      .eq("booking_id", bookingId);

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/desk/history");
}