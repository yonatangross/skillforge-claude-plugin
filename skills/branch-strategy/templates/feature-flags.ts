/**
 * Feature Flags Implementation Template
 *
 * Use feature flags to:
 * - Merge incomplete work to main safely
 * - Test in production with flag off
 * - Gradual rollout to users
 * - Instant rollback (flip flag)
 */

// =============================================================================
// BASIC FEATURE FLAGS
// =============================================================================

// Simple boolean flags from environment variables
export const FLAGS = {
  NEW_AUTH_SYSTEM: process.env.FF_NEW_AUTH === 'true',
  DARK_MODE: process.env.FF_DARK_MODE === 'true',
  EXPERIMENTAL_SEARCH: process.env.FF_EXPERIMENTAL_SEARCH === 'true',
  BETA_FEATURES: process.env.FF_BETA === 'true',
} as const;

// Type-safe flag checker
export function isEnabled(flag: keyof typeof FLAGS): boolean {
  return FLAGS[flag] ?? false;
}

// =============================================================================
// ADVANCED FEATURE FLAGS WITH PERCENTAGE ROLLOUT
// =============================================================================

interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage?: number;  // 0-100
  allowedUsers?: string[];     // Specific user IDs
  allowedGroups?: string[];    // User groups (beta, internal, etc.)
}

const featureConfig: Record<string, FeatureFlagConfig> = {
  'new-dashboard': {
    enabled: true,
    rolloutPercentage: 25,  // 25% of users
  },
  'ai-suggestions': {
    enabled: true,
    allowedGroups: ['beta', 'internal'],
  },
  'redesigned-nav': {
    enabled: false,  // Disabled globally
  },
};

/**
 * Check if feature is enabled for a specific user
 */
export function isFeatureEnabled(
  featureName: string,
  userId?: string,
  userGroups?: string[]
): boolean {
  const config = featureConfig[featureName];

  if (!config || !config.enabled) {
    return false;
  }

  // Check allowed users
  if (config.allowedUsers && userId) {
    if (config.allowedUsers.includes(userId)) {
      return true;
    }
  }

  // Check allowed groups
  if (config.allowedGroups && userGroups) {
    if (userGroups.some(g => config.allowedGroups!.includes(g))) {
      return true;
    }
  }

  // Check rollout percentage
  if (config.rolloutPercentage !== undefined && userId) {
    // Consistent hashing: same user always gets same result
    const hash = simpleHash(userId + featureName);
    return (hash % 100) < config.rolloutPercentage;
  }

  // If no specific rules, use enabled flag
  return config.enabled && !config.rolloutPercentage && !config.allowedUsers;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// =============================================================================
// REACT HOOK FOR FEATURE FLAGS
// =============================================================================

import { useMemo } from 'react';

/**
 * React hook for checking feature flags
 *
 * @example
 * const { isEnabled } = useFeatureFlag('new-dashboard');
 * if (isEnabled) {
 *   return <NewDashboard />;
 * }
 */
export function useFeatureFlag(featureName: string) {
  // In real app, get these from auth context
  const userId = 'current-user-id';
  const userGroups = ['beta'];

  const isEnabled = useMemo(
    () => isFeatureEnabled(featureName, userId, userGroups),
    [featureName, userId, userGroups]
  );

  return { isEnabled };
}

// =============================================================================
// FEATURE FLAG COMPONENT WRAPPER
// =============================================================================

interface FeatureProps {
  name: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component wrapper for feature flags
 *
 * @example
 * <Feature name="new-nav" fallback={<OldNav />}>
 *   <NewNav />
 * </Feature>
 */
export function Feature({ name, children, fallback = null }: FeatureProps) {
  const { isEnabled } = useFeatureFlag(name);
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

// =============================================================================
// SERVER-SIDE FEATURE FLAGS (for API routes)
// =============================================================================

/**
 * Middleware for feature-flagged API routes
 *
 * @example
 * // In your API handler
 * export const handler = withFeatureFlag('new-api', async (req, res) => {
 *   // Only runs if feature is enabled
 * });
 */
export function withFeatureFlag(
  featureName: string,
  handler: (req: Request, res: Response) => Promise<void>
) {
  return async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;

    if (!isFeatureEnabled(featureName, userId)) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    return handler(req, res);
  };
}

// =============================================================================
// ENVIRONMENT SETUP
// =============================================================================

/*
 * .env.development
 *
 * FF_NEW_AUTH=true
 * FF_DARK_MODE=true
 * FF_EXPERIMENTAL_SEARCH=false
 * FF_BETA=true
 */

/*
 * .env.production
 *
 * FF_NEW_AUTH=false
 * FF_DARK_MODE=true
 * FF_EXPERIMENTAL_SEARCH=false
 * FF_BETA=false
 */
