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
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80",
  },
  {
    id: 2,
    name: "Toto Popo",
    role: "Landed Property Seller",
    company: "HomeUP Client",
    content:
      "Had a great experience selling our cluster terrace with Dennis and Kenji. Their fixed fee model really works and gives full transparency, plus the service was professional and top-notch. Highly recommend them to anyone selling, from HDBs to landed. Keep up the great work!",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&q=80",
  },
  {
    id: 3,
    name: "Little Owl",
    role: "HDB Seller",
    company: "HomeUP Client",
    content:
      "Thank you Dennis and Kenji! From listing till issuing OTP, it took just one month. You guys are really impressive and I would definitely encourage sellers to engage their services. Wishing you continued success!",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&q=80",
  },
  {
    id: 4,
    name: "Kwok Yung",
    role: "Condo Seller",
    company: "HomeUP Client",
    content:
      "Second time engaging Dennis and Kenji to sell my property and it has been as smooth as the first time. Appreciate their help in negotiations and their flexibility in accommodating my schedule during OTP signing. Great work and excellent value for money.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&q=80",
  },
];

export function Testimonials() {
  return (
    <AnimatedTestimonials
      badgeText="Verified HomeUP clients"
      title="Real results, real people"
      subtitle="Homeowners share their experience working with HomeUP — transparent pricing, professional service, and real savings."
      testimonials={testimonials}
      autoRotateInterval={6000}
    />
  );
}
