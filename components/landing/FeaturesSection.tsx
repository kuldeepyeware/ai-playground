import { motion } from "framer-motion";
import { DollarSign, Clock, Layers, BarChart3 } from "lucide-react";

const FeaturesSection = () => {
  return (
    <section className='px-4 py-20 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-6xl'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='text-center'>
          <h2 className='text-3xl font-bold text-(--text-primary) sm:text-4xl'>
            Everything you need to compare AI models
          </h2>
          <p className='mx-auto mt-4 max-w-2xl text-lg text-(--text-secondary)'>
            Powerful features to help you make informed decisions about which AI
            model works best for your use case.
          </p>
        </motion.div>

        <div className='mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
          {[
            {
              icon: Layers,
              title: "Side-by-Side Comparison",
              description:
                "Compare responses across multiple models with a clean parallel layout. See differences at a glance.",
              color: "from-blue-500 to-cyan-500",
            },
            {
              icon: Clock,
              title: "Real-Time Performance",
              description:
                "Track latency and response times for each model. See which one responds fastest.",
              color: "from-purple-500 to-pink-500",
            },
            {
              icon: DollarSign,
              title: "Cost Transparency",
              description:
                "See token usage and estimated costs for each response. Make cost-effective decisions.",
              color: "from-green-500 to-emerald-500",
            },
            {
              icon: BarChart3,
              title: "Detailed Analytics",
              description:
                "Get insights into response quality, token efficiency, and performance metrics.",
              color: "from-orange-500 to-red-500",
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index }}
              className='group rounded-xl border border-border bg-(--panel-bg) p-6 transition-all hover:border-[#6366F1]/50 hover:shadow-lg'>
              <div
                className={`mb-4 inline-flex rounded-lg bg-linear-to-br ${feature.color} p-3`}>
                <feature.icon className='h-6 w-6 text-white' />
              </div>
              <h3 className='text-xl font-semibold text-(--text-primary)'>
                {feature.title}
              </h3>
              <p className='mt-2 text-sm text-(--text-secondary)'>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
