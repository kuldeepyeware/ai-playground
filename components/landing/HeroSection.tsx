import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className='relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8 lg:py-12'>
      <div className='mx-auto max-w-4xl text-center'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>
          <h1 className='text-4xl font-bold tracking-tight text-(--text-primary) sm:text-5xl lg:text-6xl'>
            The Unified Interface
            <br />
            <span className='bg-linear-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent'>
              For AI Models
            </span>
          </h1>
          <p className='mx-auto mt-4 max-w-2xl text-lg text-(--text-secondary) sm:text-xl'>
            Compare responses from GPT-4o, Claude, Grok, and more — see quality,
            latency, and costs side-by-side.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
