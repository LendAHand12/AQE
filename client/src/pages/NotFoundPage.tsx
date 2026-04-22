import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-2xl w-full text-center z-10">
        <div className="relative inline-block mb-8">
          <h1 className="text-[12rem] md:text-[18rem] font-bold leading-none select-none tracking-tighter text-foreground/5 font-heading">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-primary/10 p-6 rounded-3xl backdrop-blur-md border border-primary/20 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <span className="text-4xl md:text-6xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent font-heading">
                Lost?
              </span>
            </div>
          </div>
        </div>

        <h2 className="text-3xl md:text-5xl font-bold mb-6 font-heading tracking-tight">
          {t('notfound.title')}
        </h2>
        
        <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto leading-relaxed">
          {t('notfound.description')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full sm:w-auto rounded-full px-8 h-14 text-base font-medium transition-all hover:scale-105 active:scale-95"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Go Back
          </Button>
          <Button 
            size="lg" 
            className="w-full sm:w-auto rounded-full px-8 h-14 text-base font-medium shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90"
            onClick={() => navigate('/dashboard')}
          >
            <Home className="mr-2 h-5 w-5" />
            {t('notfound.back_home')}
          </Button>
        </div>
      </div>

      {/* Floating particles or decorative items could go here */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-pulse" />
      <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-primary/30 rounded-full animate-bounce delay-700" />
      <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-primary/20 rounded-full animate-ping" />
    </div>
  );
};

export default NotFoundPage;
