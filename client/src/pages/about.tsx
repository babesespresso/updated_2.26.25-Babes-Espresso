import React from 'react';
import { Layout } from '../components/layout';

export default function AboutPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">About Babes Espresso</h1>
        
        <div className="max-w-3xl mx-auto bg-black/40 p-8 rounded-lg border border-white/10">
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p className="text-white/80 mb-4">
              Babes Espresso was founded with a simple mission: to celebrate beauty and creativity while providing a platform for models and creators to showcase their work in a professional environment.
            </p>
            <p className="text-white/80">
              What started as a small passion project has grown into a vibrant community of creators and fans who appreciate quality content and meaningful connections.
            </p>
          </section>
          
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-white/80">
              We strive to provide a safe, respectful platform where creators can share their content with fans who appreciate their work. We believe in fair compensation for creators and a premium experience for subscribers.
            </p>
          </section>
          
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">For Creators</h2>
            <p className="text-white/80 mb-4">
              Babes Espresso offers creators a platform to:
            </p>
            <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
              <li>Showcase their portfolio to a dedicated audience</li>
              <li>Build a subscriber base of genuine fans</li>
              <li>Earn income through subscriptions and exclusive content</li>
              <li>Maintain control over their content and brand</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-white/80 mb-4">
              Have questions or feedback? We'd love to hear from you!
            </p>
            <div className="bg-black/30 p-4 rounded border border-white/10">
              <p className="text-white/80">Email: support@babesespresso.com</p>
              <p className="text-white/80">Instagram: @babesespresso</p>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
