
import { FaInstagram, FaFacebook, FaSnapchat, FaTiktok, FaThreads } from 'react-icons/fa6';
import { FaXTwitter } from 'react-icons/fa6';
import { SiPatreon } from '@icons-pack/react-simple-icons';

export function Footer() {
  return (
    <footer className="bg-black text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-8">
            <a href="https://instagram.com/babesespresso" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">
              <FaInstagram size={24} />
            </a>
            <a href="https://facebook.com/babesespresso" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">
              <FaFacebook size={24} />
            </a>
            <a href="https://snapchat.com/add/babesespresso" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition-colors">
              <FaSnapchat size={24} />
            </a>
            <a href="https://twitter.com/babesespresso" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">
              <FaXTwitter size={24} />
            </a>
            <a href="https://tiktok.com/@babesespresso" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors">
              <FaTiktok size={24} />
            </a>
            <a href="https://threads.net/@babesespresso" target="_blank" rel="noopener noreferrer" className="hover:text-purple-500 transition-colors">
              <FaThreads size={24} />
            </a>
            <a href="https://patreon.com/babesespresso" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors">
              <SiPatreon size={24} />
            </a>
          </div>
          <p className="text-sm text-center">
            Babes Espresso, LLC™. All Rights Reserved 2025
          </p>
        </div>
      </div>
    </footer>
  );
}
