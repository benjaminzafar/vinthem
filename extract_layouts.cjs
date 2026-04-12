const fs = require('fs');
const path = require('path');

const appTsxPath = path.join(__dirname, '../mavren-ai-shop/src/App.tsx');
const appTsxContent = fs.readFileSync(appTsxPath, 'utf8');

function extractComponent(content, compName) {
  const startRegex = new RegExp(`function ${compName}\\(\\) {`);
  const match = content.match(startRegex);
  if(!match) return null;
  const startIndex = match.index;
  let braceCount = 0;
  let inFunction = false;
  for(let i = startIndex; i < content.length; i++) {
    if(content[i] === '{') {
      braceCount++;
      inFunction = true;
    } else if(content[i] === '}') {
      braceCount--;
      if(inFunction && braceCount === 0) {
        return content.substring(startIndex, i + 1);
      }
    }
  }
  return null;
}

function processComponentCode(code) {
  let processed = code;
  processed = processed.replace(/<Link([^>]*?)to=/g, '<Link$1href=');
  processed = processed.replace(/useNavigate\(\)/g, 'useRouter()');
  processed = processed.replace(/useLocation\(\)/g, 'usePathname()');
  processed = "export default " + processed;
  return processed;
}

const navCode = extractComponent(appTsxContent, 'Navigation');
const footerCode = extractComponent(appTsxContent, 'Footer');

const commonImports = `"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingBag, User, LogOut, Settings, Globe, Menu, X, ChevronRight, ChevronDown, Search, Filter, ArrowRight } from 'lucide-react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import i18nInstance from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';\n\n`;

if(navCode) {
  fs.writeFileSync(path.join(__dirname, 'src/components/layout/Navigation.tsx'), commonImports + processComponentCode(navCode));
}

if(footerCode) {
  fs.writeFileSync(path.join(__dirname, 'src/components/layout/Footer.tsx'), commonImports + processComponentCode(footerCode));
}

console.log("Extraction complete.");
