export interface SequenceTemplateStep {
  step:  number;
  day:   number;
  type:  "email" | "call" | "linkedin";
  icon:  string;
  label: string;
  desc:  string;
}

export const SEQUENCE_TEMPLATE: SequenceTemplateStep[] = [
  { step: 1,  day: 1, type: "email",    icon: "✉️",  label: "Intro Email",         desc: "Send personalised intro — reference their intent signal. Keep under 5 lines. One CTA." },
  { step: 2,  day: 1, type: "linkedin", icon: "💼",  label: "LinkedIn Connect",     desc: "Send connection request with a 1-line personalised note referencing their role." },
  { step: 3,  day: 2, type: "call",     icon: "📞",  label: "Cold Call #1",         desc: "Intro call. Goal: book discovery. Leave voicemail if no answer (max 30 sec)." },
  { step: 4,  day: 2, type: "email",    icon: "✉️",  label: "Follow-Up Email",      desc: "Reference the call attempt. Add one piece of relevant content (case study / insight)." },
  { step: 5,  day: 3, type: "linkedin", icon: "💼",  label: "LinkedIn Message",     desc: "Short message after connecting. Reference their company's current project or news." },
  { step: 6,  day: 4, type: "call",     icon: "📞",  label: "Cold Call #2",         desc: "Reference email sent. Aim for conversation. If VM: leave different message than Day 2." },
  { step: 7,  day: 4, type: "email",    icon: "✉️",  label: "Value Email",          desc: "Share a relevant case study, ROI stat, or testimonial. Tie to their specific signal." },
  { step: 8,  day: 5, type: "call",     icon: "📞",  label: "Cold Call #3",         desc: "Persistence call. Mention the emails sent. Try different time of day." },
  { step: 9,  day: 5, type: "linkedin", icon: "💼",  label: "LinkedIn Post Engage", desc: "Like/comment on a recent post of theirs or their company page. Stay visible." },
  { step: 10, day: 6, type: "email",    icon: "✉️",  label: "Breakup Email Draft",  desc: "Soft breakup: 'I'll stop reaching out after this — but wanted to share one last thing…'" },
  { step: 11, day: 6, type: "call",     icon: "📞",  label: "Cold Call #4",         desc: "Final persistence call. Reference the breakup email. Last genuine attempt before pause." },
  { step: 12, day: 7, type: "linkedin", icon: "💼",  label: "LinkedIn InMail",      desc: "If not connected: send an InMail. If connected: send a direct value-led message." },
  { step: 13, day: 8, type: "call",     icon: "📞",  label: "Final Call",           desc: "Last call of sequence. Warm, no pressure. Offer to reconnect in 30 days if timing is off." },
  { step: 14, day: 8, type: "email",    icon: "✉️",  label: "Final Breakup Email",  desc: "True breakup email. Leave door open. Add to nurture list. Sequence complete." },
];
