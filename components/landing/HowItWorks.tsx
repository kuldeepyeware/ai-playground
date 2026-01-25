import { motion } from "framer-motion";

const HowItWorks = () => {
  return (
    <section className='px-4 py-20 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-6xl'>
        <div className='border rounded-xl border-border bg-(--panel-bg) px-4 py-12 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center'>
            <h2 className='text-3xl font-bold text-(--text-primary) sm:text-4xl'>
              How It Works
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-(--text-secondary)'>
              Get started in three simple steps
            </p>
          </motion.div>

          <div className='mt-16 grid gap-8 sm:grid-cols-3'>
            {[
              {
                step: "1",
                title: "Enter Your Prompt",
                description:
                  "Type your question or prompt once. We'll send it to all selected models simultaneously.",
              },
              {
                step: "2",
                title: "Compare Responses",
                description:
                  "Watch as responses stream in real-time. See quality, speed, and cost differences instantly.",
              },
              {
                step: "3",
                title: "Make Decisions",
                description:
                  "Use detailed metrics and side-by-side comparisons to choose the best model for your needs.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className='relative text-center'>
                <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#6366F1] text-xl font-bold text-white'>
                  {item.step}
                </div>
                <h3 className='text-xl font-semibold text-(--text-primary)'>
                  {item.title}
                </h3>
                <p className='mt-2 text-(--text-secondary)'>
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
