import { RouterProvider } from 'react-router';
import { router } from '@/router';
import { AuthProvider } from '@/context';

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
