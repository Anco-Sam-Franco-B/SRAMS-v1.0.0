import Card from '../../components/ui/Card';
import useAuthStore from '../../store/authStore';
import Avatar from '../../components/ui/Avatar';

export default function ParentProfile() {
  const { user } = useAuthStore();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100">My Profile</h1>
      <Card>
        <div className="flex items-center gap-6">
          <Avatar name={user ? `${user.first_name} ${user.last_name}` : 'P'} size="xl" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-surface-100">{user?.first_name} {user?.last_name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-sm text-gray-400 mt-1">Role: Parent</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
