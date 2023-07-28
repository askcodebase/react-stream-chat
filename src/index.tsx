import React from 'react';
import { createRoot } from 'react-dom/client';

import { ReactStreamChat } from '@/components/ReactStreamChat';

const root = createRoot(document.getElementById('root')!);
root.render(<ReactStreamChat />);
