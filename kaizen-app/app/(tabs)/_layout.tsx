import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface TabIconProps {
  name: IconName;
  color: string;
  label: string;
  focused: boolean;
}

function TabIcon({ name, color, label, focused }: TabIconProps) {
  const { typography } = useTheme();
  return (
    <View style={s.iconContainer}>
      <MaterialCommunityIcons name={name} size={24} color={color} />
      <Text
        style={[
          s.iconLabel,
          {
            color,
            fontFamily: focused ? typography.fontBodyMedium : typography.fontBody,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 80 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.blue500,
        tabBarInactiveTintColor: colors.textTertiary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} label="Início" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Hábitos',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? 'lightning-bolt' : 'lightning-bolt-outline'}
              color={color}
              label="Hábitos"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tarefas',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? 'checkbox-marked-circle' : 'checkbox-marked-circle-outline'}
              color={color}
              label="Tarefas"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="pomodoro"
        options={{
          title: 'Pomodoro',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? 'timer' : 'timer-outline'}
              color={color}
              label="Pomodoro"
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  iconContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 4, width: 64 },
  iconLabel:     { fontSize: 10, marginTop: 2, textAlign: 'center' },
});
