import { RouterProvider } from 'react-router';
import { router } from '@/router';
import { AuthProvider, ToastProvider } from '@/context';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
