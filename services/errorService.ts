import { useMemo } from 'react';


import { ErrorMessage } from '@/types/error';

const useErrorService = () => {
  

  return {
    getModelsError: useMemo(
      () => (error: any) => {
        return !error
          ? null
          : ({
              title: 'Error fetching models.',
              code: error.status || 'unknown',
              messageLines: error.statusText
                ? [error.statusText]
                : [
                      'Make sure your OpenAI API key is set in the bottom left of the sidebar.',
                      'If you completed this step, OpenAI may be experiencing issues.',
                  ],
            } as ErrorMessage);
      },
      [],
    ),
  };
};

export default useErrorService;
