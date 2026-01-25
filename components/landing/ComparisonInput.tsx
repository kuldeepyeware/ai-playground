import { motion } from "framer-motion";
import { PromptInput } from "@/components/common/PromptInput";

const ComparisonInput = () => {
  return (
    <section id='comparison-tool' className='px-4 py-8 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-7xl space-y-8'>
        {/* Prompt Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}>
          <PromptInput />
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonInput;
