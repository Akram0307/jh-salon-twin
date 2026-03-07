export interface WhatsAppTemplate {
  name: string
  category: string
  body: string
}

export const whatsappTemplates: WhatsAppTemplate[] = [

// BOOKING LIFECYCLE
{ name: "salonos_booking_confirmation_v1", category: "booking", body: "✅ Your appointment for {{1}} on {{2}} at {{3}} is confirmed. Reply RESCHEDULE or CANCEL if needed." },
{ name: "salonos_booking_reminder_v1", category: "booking", body: "⏰ Reminder: you have an appointment for {{1}} tomorrow at {{2}}." },
{ name: "salonos_booking_reschedule_v1", category: "booking", body: "Your appointment has been rescheduled to {{1}} at {{2}}." },
{ name: "salonos_booking_cancelled_v1", category: "booking", body: "Your appointment for {{1}} on {{2}} has been cancelled." },
{ name: "salonos_waitlist_offer_v1", category: "booking", body: "A slot just opened for {{1}} today at {{2}}. Reply YES to book it." },
{ name: "salonos_client_welcome_v1", category: "booking", body: "Welcome to {{1}}! We look forward to seeing you soon." },
{ name: "salonos_rebooking_prompt_v1", category: "booking", body: "It's time for your next {{1}}. Want to rebook this week?" },

// CLIENT LIFECYCLE
{ name: "salonos_client_followup_v1", category: "lifecycle", body: "How was your recent visit to {{1}}? We'd love your feedback." },
{ name: "salonos_client_feedback_request_v1", category: "lifecycle", body: "Please rate your appointment with {{1}} from 1–5." },
{ name: "salonos_birthday_offer_v1", category: "lifecycle", body: "🎉 Happy Birthday {{1}}! Enjoy a special salon treat this week." },
{ name: "salonos_loyalty_reward_v1", category: "lifecycle", body: "You've earned a loyalty reward! Redeem it on your next visit." },
{ name: "salonos_inactive_client_reactivation_v1", category: "lifecycle", body: "We miss you! Book again this month and enjoy a special offer." },
{ name: "salonos_vip_client_offer_v1", category: "lifecycle", body: "VIP access: priority booking slots available this week." },
{ name: "salonos_referral_invite_v1", category: "lifecycle", body: "Invite a friend and both of you receive a reward." },
{ name: "salonos_review_request_v1", category: "lifecycle", body: "Loved your service? Leave us a quick review!" },

// REVENUE OPTIMIZATION
{ name: "salonos_last_minute_discount_v1", category: "revenue", body: "⚡ Last minute opening today at {{1}} — book now and save." },
{ name: "salonos_slow_day_promo_v1", category: "revenue", body: "Special midweek promotion available tomorrow." },
{ name: "salonos_upgrade_offer_v1", category: "revenue", body: "Upgrade your {{1}} appointment with {{2}} for a special price." },
{ name: "salonos_bundle_offer_v1", category: "revenue", body: "Bundle offer: {{1}} + {{2}} today for a discounted price." },
{ name: "salonos_premium_service_upsell_v1", category: "revenue", body: "Enhance your visit with our premium {{1}} treatment." },
{ name: "salonos_addon_offer_v1", category: "revenue", body: "Add {{1}} to your appointment for extra care." },
{ name: "salonos_upgrade_reminder_v1", category: "revenue", body: "Want to upgrade your upcoming appointment?" },
{ name: "salonos_membership_offer_v1", category: "revenue", body: "Join our membership for exclusive perks." },
{ name: "salonos_package_offer_v1", category: "revenue", body: "Save with our multi‑service package." },
{ name: "salonos_priority_slot_offer_v1", category: "revenue", body: "Priority slot available today." },

// AI MARKETING
{ name: "salonos_seasonal_campaign_v1", category: "marketing", body: "Seasonal styles are here — book your look." },
{ name: "salonos_holiday_promo_v1", category: "marketing", body: "Holiday special offer available this week." },
{ name: "salonos_ai_revenue_boost_v1", category: "marketing", body: "AI found a perfect appointment time for you." },
{ name: "salonos_dynamic_demand_offer_v1", category: "marketing", body: "Demand is low today — enjoy a limited offer." },
{ name: "salonos_flash_sale_v1", category: "marketing", body: "⚡ Flash sale today only." },
{ name: "salonos_new_service_launch_v1", category: "marketing", body: "New service now available." },
{ name: "salonos_event_invite_v1", category: "marketing", body: "You're invited to our special salon event." },
{ name: "salonos_trend_alert_v1", category: "marketing", body: "Trending styles just arrived." },
{ name: "salonos_reengagement_campaign_v1", category: "marketing", body: "We have something new for you." },
{ name: "salonos_ai_recommendation_v1", category: "marketing", body: "Based on your visits we recommend {{1}}." },

// OPERATIONAL
{ name: "salonos_payment_confirmation_v1", category: "ops", body: "✅ Payment received. Thank you!" },
{ name: "salonos_receipt_delivery_v1", category: "ops", body: "Your receipt for {{1}} is attached." },
{ name: "salonos_checkin_prompt_v1", category: "ops", body: "Reply HERE when you arrive." },
{ name: "salonos_staff_schedule_update_v1", category: "ops", body: "Your stylist {{1}} schedule has changed." },
{ name: "salonos_system_notification_v1", category: "ops", body: "System update regarding your appointment." }
]

export default whatsappTemplates
