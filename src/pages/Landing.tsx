import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Gamepad2, 
  Shield, 
  Globe, 
  Wifi, 
  Clock,
  Sparkles,
  Heart,
  Star
} from 'lucide-react';
import { SEO } from '@/components/SEO';
import jubeeLogo from '@/assets/jubee-logo.svg';

const FIRST_VISIT_KEY = 'jubee_has_visited';

const features = [
  {
    icon: BookOpen,
    title: 'Interactive Stories',
    description: 'Engaging tales with audio narration that bring learning to life'
  },
  {
    icon: Gamepad2,
    title: 'Educational Games',
    description: 'Fun games teaching letters, numbers, colors, and more'
  },
  {
    icon: Shield,
    title: 'Parental Controls',
    description: 'Screen time limits and activity monitoring for peace of mind'
  },
  {
    icon: Globe,
    title: '5 Languages',
    description: 'English, Spanish, French, Mandarin, and Hindi support'
  },
  {
    icon: Wifi,
    title: 'Offline Ready',
    description: 'Works without internet - perfect for travel and anywhere'
  },
  {
    icon: Clock,
    title: 'Screen Time',
    description: 'Smart limits help balance learning and playtime'
  }
];

export function markAsReturningVisitor() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(FIRST_VISIT_KEY, 'true');
  }
}

export function isFirstTimeVisitor(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(FIRST_VISIT_KEY) !== 'true';
}

export default function Landing() {
  const navigate = useNavigate();

  const handleStartLearning = () => {
    markAsReturningVisitor();
    navigate('/');
  };

  const handleParentHub = () => {
    markAsReturningVisitor();
    navigate('/parent');
  };
  return (
    <>
      <SEO 
        title="Jubee.Love - Where Learning Meets Magic"
        description="An AI-powered educational app for toddlers featuring Jubee, a magical bee companion that makes learning fun, safe, and engaging."
      />
      
      <div className="min-h-screen bg-background overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-12 text-center overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 bg-gradient-to-b from-accent/20 via-background to-background" />
          <div className="absolute top-20 left-10 w-32 h-32 bg-accent/30 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
          
          <motion.div 
            className="relative z-10 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo/Mascot area */}
            <motion.div 
              className="mb-8"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <img 
                src={jubeeLogo} 
                alt="Jubee - Your learning companion" 
                className="w-40 h-40 mx-auto"
              />
            </motion.div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4">
              <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                Jubee.Love
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-muted-foreground mb-2 font-medium">
              Where Learning Meets Magic ✨
            </p>
            
            <p className="text-base sm:text-lg text-muted-foreground/80 mb-8 max-w-2xl mx-auto">
              An AI-powered educational companion for toddlers. Meet Jubee, your child's magical bee friend who makes learning letters, numbers, colors, and stories fun!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 rounded-2xl shadow-xl hover:scale-105 transition-transform"
                onClick={handleStartLearning}
              >
                <Heart className="w-5 h-5 mr-2" />
                Start Learning
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6 rounded-2xl border-2 hover:scale-105 transition-transform"
                onClick={handleParentHub}
              >
                <Shield className="w-5 h-5 mr-2" />
                Parent Hub
              </Button>
            </div>
          </motion.div>
          
          {/* Scroll indicator */}
          <motion.div 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">
              <div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
            </div>
          </motion.div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Everything Your Child Needs
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                A complete learning experience designed with love and backed by child development research
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 h-full hover:shadow-xl transition-shadow border-2 hover:border-primary/30">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* AI Companion Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 bg-accent/20 px-4 py-2 rounded-full mb-6">
                <Star className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">AI-Powered Companion</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Meet Jubee, Your Child's New Best Friend
              </h2>
              
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Jubee is more than a mascot – it's an AI companion that responds to your child's emotions, 
                celebrates their achievements, and makes learning feel like play. With warm, whimsical voices 
                and expressive animations, Jubee creates magical moments every day.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                <div className="bg-card p-6 rounded-2xl border-2 border-border">
                  <div className="text-2xl mb-2">🎤</div>
                  <h4 className="font-bold mb-1">Voice Interaction</h4>
                  <p className="text-sm text-muted-foreground">Natural conversations with emotion-aware responses</p>
                </div>
                <div className="bg-card p-6 rounded-2xl border-2 border-border">
                  <div className="text-2xl mb-2">🏆</div>
                  <h4 className="font-bold mb-1">Celebrates Success</h4>
                  <p className="text-sm text-muted-foreground">Encouragement and rewards for every milestone</p>
                </div>
                <div className="bg-card p-6 rounded-2xl border-2 border-border">
                  <div className="text-2xl mb-2">📊</div>
                  <h4 className="font-bold mb-1">Parent Insights</h4>
                  <p className="text-sm text-muted-foreground">AI-powered developmental progress reports</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-br from-primary/10 to-accent/10">
          <motion.div 
            className="max-w-2xl mx-auto text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Start the Adventure?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of families who trust Jubee.Love for their children's early education journey.
            </p>
            <Button 
              size="lg" 
              className="text-xl px-10 py-7 rounded-2xl shadow-2xl hover:scale-105 transition-transform"
              onClick={handleStartLearning}
            >
              <Sparkles className="w-6 h-6 mr-2" />
              Let's Go!
            </Button>
          </motion.div>
        </section>
        
        {/* Footer */}
        <footer className="py-8 px-4 border-t border-border">
          <div className="max-w-4xl mx-auto text-center text-muted-foreground text-sm">
            <p className="mb-2">© 2024 Jubee.Love - Part of the Apex Ecosystem</p>
            <p>Made with 💛 for little learners everywhere</p>
          </div>
        </footer>
      </div>
    </>
  );
}
