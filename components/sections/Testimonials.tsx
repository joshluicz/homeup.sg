import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";

const testimonials = [
  {
    id: 1,
    name: "Ernest Lim",
    role: "HDB Seller",
    company: "HomeUP Client",
    content:
      "The team led by Dennis has done a wonderful job in selling my house. He and one of his teammates, Kenji, went beyond their scope of work, ensuring there was always a steady stream of potential buyers viewing my house. Their professionalism, friendliness, and efficiency made selling my house a wonderful experience.",
    rating: 5,
  },
  {
    id: 2,
    name: "Terrence Koh",
    role: "Condo Seller",
    company: "HomeUP Client",
    content:
      "If I can give more than 5 stars, I will unreservedly do so. I am very impressed with Tong Boon, who has provided top notch agency service for the sale of my condo recently. His commitment towards meeting the best interests of the seller is exceptional, and the whole process with him has been seamless and efficient.",
    rating: 5,
  },
  {
    id: 3,
    name: "Mark Kwok Leong",
    role: "HDB Seller",
    company: "HomeUP Client",
    content:
      "Highly recommend Kenji for his professional and honest service. He helped us secure a buyer for my dad's HDB flat quickly that was higher than the last transacted price. More importantly, he provided excellent guidance, which allowed my dad to successfully take over and purchase my HDB flat. It was a win-win situation for our family thanks to his effort. Great job, Kenji.",
    rating: 5,
  },
  {
    id: 4,
    name: "Kwok Yung",
    role: "Condo Seller",
    company: "HomeUP Client",
    content:
      "Second time engaging Dennis and Kenji to sell my property and it has been as smooth as the first time. Appreciate their help in negotiations and their flexibility in accommodating my schedule during OTP signing. Great work and excellent value for money.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <AnimatedTestimonials
      badgeText="Verified HomeUP clients"
      title="Real results, real people"
      subtitle="Homeowners share their experience working with HomeUP: transparent pricing, professional service, and real savings."
      testimonials={testimonials}
      autoRotateInterval={6000}
    />
  );
}
