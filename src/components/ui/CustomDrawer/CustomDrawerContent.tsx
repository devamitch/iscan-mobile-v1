import { useAuthStore } from '@/store/slices/authSlice'
import { useThemeStore } from '@/store/slices/themeSlice'
import { hapticFeedback } from '@/utils/haptics'
import { DrawerContentScrollView, type DrawerContentComponentProps } from '@react-navigation/drawer'
import type React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'

interface DrawerItem {
  name: string
  label: string
  icon: string
  route: string
}

const drawerItems: DrawerItem[] = [
  { name: 'Home', label: 'Home', icon: 'home', route: 'Home' },
  { name: 'Scanner', label: 'Scanner', icon: 'camera-alt', route: 'Scanner' },
  { name: 'Analytics', label: 'Analytics', icon: 'analytics', route: 'Analytics' },
  { name: 'Profile', label: 'Profile', icon: 'person', route: 'Profile' },
  { name: 'Chat', label: 'AI Chat', icon: 'chat', route: 'Chat' },
  { name: 'Settings', label: 'Settings', icon: 'settings', route: 'Settings' },
]

export const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { colors, theme } = useThemeStore()
  const { user, logout } = useAuthStore()

  const handleItemPress = (route: string) => {
    hapticFeedback('selection')
    props.navigation.navigate(route)
  }

  const handleLogout = async () => {
    hapticFeedback('warning')
    try {
      await logout()
      props.navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const isActiveRoute = (routeName: string) => {
    return props.state.routeNames[props.state.index] === routeName
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={theme.isDark ? ['#1a1a2e', '#16213e'] : ['#667eea', '#764ba2']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileContainer}>
            <Image
              source={user?.photoURL ? { uri: user.photoURL } : require('@/assets/images/default-avatar.jpg')}
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.displayName || 'Guest User'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'guest@example.com'}</Text>
            </View>
          </View>
        </View>

        {/* Navigation Items */}
        <DrawerContentScrollView
          {...props}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.menuContainer}>
            {drawerItems.map((item) => {
              const isActive = isActiveRoute(item.route)
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.menuItem, isActive && styles.activeMenuItem]}
                  onPress={() => handleItemPress(item.route)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={item.icon}
                    size={24}
                    color={isActive ? colors.primary : colors.text}
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuLabel, { color: isActive ? colors.primary : colors.text }]}>
                    {item.label}
                  </Text>
                  {isActive && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
                </TouchableOpacity>
              )
            })}
          </View>
        </DrawerContentScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" size={24} color="#FF6B6B" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>AEye Scan v1.0.0</Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollContent: {
    flexGrow: 1,
  },
  menuContainer: {
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginVertical: 2,
    borderRadius: 12,
    position: 'relative',
  },
  activeMenuItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -12,
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF6B6B',
    marginLeft: 12,
    fontWeight: '500',
  },
  versionContainer: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
})
