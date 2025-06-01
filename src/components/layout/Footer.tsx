"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FaGithub, FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Logo and tagline */}
          <div className="mb-6 md:mb-0">
            <Link href="/" className="flex items-center space-x-2">
              <motion.div
                whileHover={{ rotate: 10 }}
                className="text-primary-400"
              >
                <Image
                  src="/icons/calendar-logo.svg"
                  alt="EventFinder Logo"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
              </motion.div>
              <span className="font-bold text-lg text-white">EventFinder</span>
            </Link>
            <p className="text-sm text-gray-400 mt-2">
              Discover events happening around you
            </p>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-8 md:gap-20 mb-6 md:mb-0">
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Explore</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/events"
                    className="text-sm text-gray-400 hover:text-primary-400"
                  >
                    All Events
                  </Link>
                </li>
                <li>
                  <Link
                    href="/recommendations"
                    className="text-sm text-gray-400 hover:text-primary-400"
                  >
                    For You
                  </Link>
                </li>
                <li>
                  <Link
                    href="/search"
                    className="text-sm text-gray-400 hover:text-primary-400"
                  >
                    Search
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-sm text-gray-400 hover:text-primary-400"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-sm text-gray-400 hover:text-primary-400"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-gray-400 hover:text-primary-400"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Social links */}
          <div className="text-center md:text-right">
            <h3 className="text-sm font-semibold text-white mb-3">
              Connect With Us
            </h3>
            <div className="flex space-x-4 justify-center md:justify-end">
              <a
                href="https://x.com/SuiNetwork"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-400"
              >
                <FaXTwitter size={18} />
                <span className="sr-only">Twitter</span>
              </a>
              <a
                href="https://www.instagram.com/sui.network.official/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-400"
              >
                <FaInstagram size={18} />
                <span className="sr-only">Instagram</span>
              </a>
              <a
                href="https://github.com/MystenLabs/sui"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-400"
              >
                <FaGithub size={18} />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-400">
            © {currentYear} EventFinder. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
