"use client";

import  { useRef } from 'react';

import { useForm, ValidationError } from '@formspree/react';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { useAuth } from '@/context/useAuth';

const Contact = () => {
  const [state, handleSubmit] = useForm(process.env.NEXT_PUBLIC_FORMSPREE_ID);
  const formRef = useRef(null);
  const { profile } = useAuth();

  const onSubmit = async (e) => {
    await handleSubmit(e);
    if (!state.errors?.length) {
      toast.success('Message sent! Our team will get back to you soon.');
      formRef.current?.reset();
    }
  };

  return (
    <section className="relative ">
      <div className="relative flex items-center min-h-screen justify-center flex-col max-w-5xl mx-auto">
        <img src="/terminal.png" alt="" className='absolute inset-0 min-h-screen ' />
        <div className="z-20 p-6">
          <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Contact Me
          </h3>
          <p className="text-base text-gray-600 dark:text-gray-400 mt-3">
            Whether you&apos;re looking to build a website, improve your existing platform, or bring a
            unique project to life, I'm here to help.
          </p>

          <form ref={formRef} onSubmit={onSubmit} className=' space-y-7 mt-12'>

            <Label className='space-y-2 md:space-y-3 flex flex-col  items-start'>
              <span className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">Full Name:</span>
              <Input
                type="text"
                name="name"
                required
                defaultValue={profile?.name}
                className='w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200'
                placeholder='John Doe'
              />
              <ValidationError prefix="Name" field="name" errors={state.errors}
                className="text-red-400 text-sm" />
            </Label>

            <Label className='space-y-3 flex flex-col items-start'>
              <span className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">Email:</span>
              <Input
                type="email"
                name="email"
                defaultValue={profile?.email}
                required
                className='w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200'
                placeholder='johndoe@gmail.com'
              />
              <ValidationError prefix="Email" field="email" errors={state.errors}
                className="text-red-400 text-sm" />
            </Label>

            <Label className='space-y-3 flex flex-col items-start'>
              <span className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">Your Message:</span>
              <Textarea
                name="message"
                id="message"
                rows={5}
                required
                className='w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none'
                placeholder="Hi, I'm interested in..."
              />
              <ValidationError prefix="Message" field="message" errors={state.errors}
                className="text-red-400 text-sm" />
            </Label>

            <Button className="w-full max-w-sm mx-auto flex  items-center justify-center gap-2  disabled:opacity-50 disabled:cursor-not-allowed" type="submit" disabled={state.submitting}>
              {state.submitting ? "Sending..." : "Send Message"}
              <ArrowRight className='w-4 h-4' />
            </Button>

          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;