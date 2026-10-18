import type { SampleMessage } from '../../shared/types';

// Fictional demo messages. The .example domain is reserved for demonstrations.
export const SAMPLES: SampleMessage[] = [
  {
    id: 'A',
    mode: 'scam',
    label: 'Test A: Obvious scam',
    description: 'Fake scholarship demanding an upfront fee with a minutes-long deadline.',
    expected: 'high',
    text: `🎓 CONGRATULATIONS!!

You have been selected for a ₹50,000 student scholarship under the National Scholarship scheme.

Pay a refundable ₹499 verification fee within 15 minutes to secure your award, otherwise it will be cancelled.

Send payment to UPI: scholarshipdesk@ybl and share your Aadhaar details through the link below.

Apply now: http://scholarship-verify.example/claim

Do not share this message with anyone. Contact us on WhatsApp only.`,
  },
  {
    id: 'B',
    mode: 'scam',
    label: 'Test B: Legitimate-looking announcement',
    description: 'A fictional college announces a merit scholarship with official contacts and no fee.',
    expected: 'low',
    text: `Dear Ananya,

The Office of the Dean of Student Welfare, Birla Institute of Applied Sciences, invites applications for the 2026-27 Merit Scholarship for second-year B.Tech students with a CGPA of 8.5 or above.

There is no application fee. Submit the form on the student portal at https://portal.bias.ac.in/scholarships along with your previous semester grade card.

Last date to apply: 30 November 2026. Results will be announced on the notice board and by email from the registrar's office.

For queries, contact Dr. R. Mehta, Scholarship Coordinator, at scholarships@bias.ac.in or 01234-567890 (Mon-Fri, 10am-4pm).`,
  },
  {
    id: 'C',
    mode: 'scam',
    label: 'Test C: Sophisticated scam',
    description: 'Professional tone and fewer red flags, but a "training fee" still gives it away.',
    expected: 'high',
    text: `Subject: Offer Letter - Summer Internship Program 2026 (Data Analytics)

Dear Candidate,

Further to our evaluation of your profile, we are pleased to offer you a position in the Summer Internship Program at Nexora Technologies Pvt. Ltd. The internship carries a stipend of ₹15,000 per month and a certificate on completion.

To confirm your acceptance, kindly complete the onboarding formalities within 48 hours:
1. Reply with a scanned copy of your PAN card and college ID.
2. Remit the one-time training and documentation fee of ₹2,499 (fully refundable with your first stipend) via the secure link: https://nexora-onboarding.xyz/pay

Seats are limited and will be allotted on a first-come basis.

Regards,
HR Team, Nexora Technologies
nexora.hr.team@gmail.com`,
  },
  {
    id: 'D',
    mode: 'scam',
    label: 'Test D: Grey area',
    description: 'Student-club internship post: no fee, but unofficial contact, a short deadline and a shortened link.',
    expected: 'medium',
    text: `Hey everyone! Our NGO partner is taking 20 interns for a 6-week social media internship (unpaid, certificate provided).

Limited seats, so apply within 3 days. Form: https://bit.ly/ngo-intern-2026

No fee. For questions message Priya on WhatsApp or email ngo.internships2026@gmail.com`,
  },
  {
    id: 'E',
    mode: 'ai',
    label: 'Test E: AI-style essay',
    description: 'Textbook LLM essay: inflated significance, triplets, "In conclusion", even rhythm.',
    expected: 'high',
    text: `**The Importance of Time Management for Students**

In today's fast-paced academic landscape, time management stands as a cornerstone of student success. It is not just about scheduling tasks; it is about fostering discipline, enhancing productivity, and cultivating a balanced lifestyle. Effective time management plays a pivotal role in reducing stress and unlocking the potential of every learner.

Additionally, students who meticulously plan their days are better equipped to navigate the intricate demands of coursework, extracurricular activities, and personal commitments. Furthermore, prioritizing tasks ensures that crucial deadlines are met without compromising the quality of work. This holistic approach serves as a testament to the transformative power of structured routines.

Moreover, leveraging digital tools can significantly enhance one's ability to track progress and stay organized. Experts argue that students who embrace such tools demonstrate improved academic outcomes, greater resilience, and stronger self-awareness. Ultimately, these habits underscore the importance of intentional living.

In conclusion, time management is not merely a skill but a vital foundation for lifelong success. By embracing effective strategies, students can achieve their goals, maintain their well-being, and embark on a journey of continuous growth.`,
  },
  {
    id: 'F',
    mode: 'ai',
    label: 'Test F: Human student message',
    description: 'A hostel WhatsApp message with typos, Hinglish and a real complaint.',
    expected: 'low',
    text: `bhai i seriously cant manage time this sem. yesterday i had the DBMS lab at 2pm and i completely forgot about it coz i was fixing the project with Rohan till like 4am. prof wasn't even angry, which is somehow worse??

my roommate says use a planner app or something.. i tried notion for 2 days lol. the real problem is i say yes to everything - club work, that hackathon, helping juniors with C. nahi bolna seekhna padega honestly.

anyway can you send me the OS notes from last week, the ones with the scheduling diagrams? i'll return the favour before endsems, promise :)`,
  },
  {
    id: 'G',
    mode: 'ai',
    label: 'Test G: Polished human report',
    description: 'Formal, well-edited human writing. Shows how academic prose can look borderline.',
    expected: 'medium',
    text: `Project report: Library seat-availability tracker

Our group built a small system that shows how many seats are free on each floor of the central library. We used two ESP32 boards with ultrasonic sensors mounted under the tables on the second floor, which had the worst crowding during the April exams. The boards post a count to a Flask server every thirty seconds, and a web page shows the numbers.

The hardest part was not the code. The sensors kept reporting a seat as occupied whenever someone left a bag on it, and we only noticed after three days of wrong data. We fixed this partly by raising the threshold distance and partly by accepting that bags are, for practical purposes, people.

We tested the system for two weeks. On weekdays the second floor reached 90% occupancy between 2pm and 6pm. The web page was opened 412 times, mostly from the hostel network, which suggests students checked before walking over. We would like to extend it to the first floor next semester if the department approves the sensor budget of about ₹6,000.`,
  },
];
