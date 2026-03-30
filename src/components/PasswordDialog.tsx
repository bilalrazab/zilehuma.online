// Password dialog removed — blog management is now protected by server-side RLS policies
// This component is kept as a no-op for backward compatibility
const PasswordDialog = ({ open }: { open: boolean; onClose: () => void; onSuccess: () => void; action?: string }) => {
  return null;
};

export default PasswordDialog;
