import { Question } from '../types';

export const teachingStyleQuestions: (Question & { section: string })[] = [
  // SECTION A – Teaching Orientation (Teacher-centered vs Student-centered)
  { id: 1, text: "I see my main role as delivering content clearly to students.", dimension: "Authority", section: "A" },
  { id: 2, text: "Students should mostly listen, take notes, and follow instructions.", dimension: "Authority", section: "A" },
  { id: 3, text: "I design lessons where students discover ideas for themselves.", dimension: "Facilitation", section: "A" },
  { id: 4, text: "I prefer students to discuss, debate, and question during lessons.", dimension: "Facilitation", section: "A" },
  { id: 5, text: "I encourage students to take responsibility for their own learning.", dimension: "Facilitation", section: "A" },
  { id: 6, text: "I feel uncomfortable when lessons are noisy or unpredictable.", dimension: "Authority", section: "A" },
  { id: 7, text: "I enjoy facilitating rather than lecturing.", dimension: "Facilitation", section: "A" },
  { id: 8, text: "I believe learning happens best when students are actively involved.", dimension: "Facilitation", section: "A" },

  // SECTION B – Instructional Style (How lessons are delivered)
  { id: 9, text: "I mostly teach using explanations and examples.", dimension: "Transmission", section: "B" },
  { id: 10, text: "I often use demonstrations, models, or visual aids.", dimension: "Transmission", section: "B" },
  { id: 11, text: "I include hands-on activities or experiments in my lessons.", dimension: "Construction", section: "B" },
  { id: 12, text: "I use storytelling, real-life examples, or case studies.", dimension: "Construction", section: "B" },
  { id: 13, text: "I give students tasks to solve in groups.", dimension: "Construction", section: "B" },
  { id: 14, text: "I prefer structured lessons with clear steps.", dimension: "Transmission", section: "B" },
  { id: 15, text: "I like flexible lessons that change based on student responses.", dimension: "Construction", section: "B" },
  { id: 16, text: "I use technology (videos, slides, apps, simulations) to teach.", dimension: "Construction", section: "B" },

  // SECTION C – Classroom Control & Management
  { id: 17, text: "I keep strict control of the classroom.", dimension: "Authority", section: "C" },
  { id: 18, text: "I allow students to express themselves freely.", dimension: "Facilitation", section: "C" },
  { id: 19, text: "I set clear rules and expect students to follow them.", dimension: "Authority", section: "C" },
  { id: 20, text: "I involve students in setting classroom expectations.", dimension: "Facilitation", section: "C" },
  { id: 21, text: "I handle discipline issues firmly and quickly.", dimension: "Authority", section: "C" },
  { id: 22, text: "I prefer resolving discipline issues through discussion.", dimension: "Facilitation", section: "C" },
  { id: 23, text: "A quiet class means students are learning.", dimension: "Authority", section: "C" },
  { id: 24, text: "An active class means students are learning.", dimension: "Facilitation", section: "C" },

  // SECTION D – Student Engagement & Motivation
  { id: 25, text: "I motivate students mainly through grades and tests.", dimension: "Extrinsic", section: "D" },
  { id: 26, text: "I motivate students by making lessons interesting and relevant.", dimension: "Intrinsic", section: "D" },
  { id: 27, text: "I praise effort as much as achievement.", dimension: "Intrinsic", section: "D" },
  { id: 28, text: "I challenge high-performing students with extra tasks.", dimension: "Intrinsic", section: "D" },
  { id: 29, text: "I give extra support to struggling students.", dimension: "Intrinsic", section: "D" },
  { id: 30, text: "I use competition to motivate students.", dimension: "Extrinsic", section: "D" },
  { id: 31, text: "I use collaboration to motivate students.", dimension: "Intrinsic", section: "D" },
  { id: 32, text: "I connect lessons to students’ real lives.", dimension: "Intrinsic", section: "D" },

  // SECTION E – Assessment & Feedback Style
  { id: 33, text: "I rely mostly on exams and quizzes to assess learning.", dimension: "Judgment", section: "E" },
  { id: 34, text: "I use projects, presentations, or portfolios.", dimension: "Growth", section: "E" },
  { id: 35, text: "I give written feedback on student work.", dimension: "Growth", section: "E" },
  { id: 36, text: "I give verbal feedback during lessons.", dimension: "Growth", section: "E" },
  { id: 37, text: "I correct mistakes immediately.", dimension: "Judgment", section: "E" },
  { id: 38, text: "I allow students to learn from mistakes first.", dimension: "Growth", section: "E" },
  { id: 39, text: "I use assessment to rank students.", dimension: "Judgment", section: "E" },
  { id: 40, text: "I use assessment to guide improvement.", dimension: "Growth", section: "E" },

  // SECTION F – Adaptability & Differentiation
  { id: 41, text: "I teach all students in mostly the same way.", dimension: "Fixed", section: "F" },
  { id: 42, text: "I change how I teach based on student ability.", dimension: "Adaptive", section: "F" },
  { id: 43, text: "I provide different tasks for different learners.", dimension: "Adaptive", section: "F" },
  { id: 44, text: "I adapt lessons when students are confused.", dimension: "Adaptive", section: "F" },
  { id: 45, text: "I feel comfortable trying new teaching methods.", dimension: "Adaptive", section: "F" },
  { id: 46, text: "I prefer to stick to methods I already know work.", dimension: "Fixed", section: "F" },
  { id: 47, text: "I modify lessons for slow learners.", dimension: "Adaptive", section: "F" },
  { id: 48, text: "I extend lessons for fast learners.", dimension: "Adaptive", section: "F" },

  // SECTION G – Relationship & Emotional Climate
  { id: 49, text: "I keep a professional distance from students.", dimension: "FearBased", section: "G" },
  { id: 50, text: "I try to know my students personally.", dimension: "Safe", section: "G" },
  { id: 51, text: "I believe trust improves learning.", dimension: "Safe", section: "G" },
  { id: 52, text: "I focus mainly on academic performance.", dimension: "FearBased", section: "G" },
  { id: 53, text: "I care about students’ emotional well-being.", dimension: "Safe", section: "G" },
  { id: 54, text: "I am approachable outside class.", dimension: "Safe", section: "G" },
  { id: 55, text: "Students feel safe to ask questions in my class.", dimension: "Safe", section: "G" },
  { id: 56, text: "Students are afraid of making mistakes in my class.", dimension: "FearBased", section: "G" },

  // SECTION H – Innovation & Growth
  { id: 57, text: "I attend training to improve my teaching.", dimension: "Growth", section: "H" },
  { id: 58, text: "I reflect on what worked and what didn’t after lessons.", dimension: "Growth", section: "H" },
  { id: 59, text: "I seek feedback from students.", dimension: "Growth", section: "H" },
  { id: 60, text: "I am open to coaching and mentoring.", dimension: "Growth", section: "H" },
  { id: 61, text: "I use data (test scores, behaviour, attendance) to improve teaching.", dimension: "Growth", section: "H" },
  { id: 62, text: "I like experimenting with new strategies.", dimension: "Innovation", section: "H" },
  { id: 63, text: "I learn from other teachers.", dimension: "Growth", section: "H" },
  { id: 64, text: "I actively try to improve my teaching every term.", dimension: "Growth", section: "H" }
];
