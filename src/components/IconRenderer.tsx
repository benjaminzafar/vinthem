import React from 'react';
import { icons as lucideIcons } from 'lucide-react';
import * as mdIcons from 'react-icons/md';
import * as faIcons from 'react-icons/fa';
import * as giIcons from 'react-icons/gi';
import { Image } from 'lucide-react';

const allIcons: Record<string, React.ElementType> = {
  ...lucideIcons,
  ...mdIcons,
  ...faIcons,
  ...giIcons
};

interface IconRendererProps {
  iconName: string;
  className?: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ iconName, className }) => {
  let name = iconName;
  if (name.startsWith('lucide:')) {
    name = name.replace('lucide:', '');
  } else if (name.startsWith('icon:')) {
    name = name.replace('icon:', '');
  }
  
  const IconComponent = allIcons[name] || Image;
  return <IconComponent className={className} />;
};
