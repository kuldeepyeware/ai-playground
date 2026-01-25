import { motion } from "framer-motion";

const StatsSection = () => {
  return (
    <section className='px-4 py-20 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-6xl'>
        <div className='border rounded-xl border-border bg-(--panel-bg) px-4 py-12 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-2 gap-8 sm:grid-cols-4'>
            {[
              { value: "10+", label: "AI Models" },
              { value: "3", label: "Major Providers" },
              { value: "Real-time", label: "Comparison" },
              { value: "100%", label: "Transparent" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className='text-center'>
                <div className='text-3xl font-bold text-(--text-primary) sm:text-4xl'>
                  {stat.value}
                </div>
                <div className='mt-2 text-sm text-(--text-secondary) sm:text-base'>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
