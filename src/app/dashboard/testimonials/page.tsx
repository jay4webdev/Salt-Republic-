import TestimonialManager from "./TestimonialManager";
import { getAllTestimonials } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TestimonialsPage() {
  const testimonials = await getAllTestimonials();
  return <TestimonialManager testimonials={testimonials} />;
}
