import React from 'react';

export interface LayoutEvent {
  nativeEvent: {
    layout: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

export type ViewStyle = React.CSSProperties & {
  elevation?: number;
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  paddingVertical?: number | string;
  paddingHorizontal?: number | string;
  marginVertical?: number | string;
  marginHorizontal?: number | string;
};

export type TextStyle = ViewStyle & {
  fontSize?: number;
  fontWeight?:
    'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  lineHeight?: number;
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
};

export type ImageStyle = ViewStyle & {
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
};

export const StyleSheet = {
  create: <T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(styles: T): T => styles,
  flatten: (style: unknown): Record<string, unknown> => {
    if (Array.isArray(style)) {
      return Object.assign({}, ...style.filter(Boolean));
    }
    return (style as Record<string, unknown>) || {};
  },
};

export const Platform = {
  OS: 'ios' as 'ios' | 'android' | 'web',
  select: <T,>(obj: { ios?: T; android?: T; web?: T; default?: T }): T => {
    return (obj.ios ?? obj.default ?? ({} as T)) as T;
  },
};

const defaultDimensions = {
  width: 390,
  height: 844,
  scale: 3,
  fontScale: 1,
};

export const Dimensions = {
  get: (_dim: 'window' | 'screen') => defaultDimensions,
  set: (dims: Partial<typeof defaultDimensions>) => Object.assign(defaultDimensions, dims),
};

export function useWindowDimensions() {
  return defaultDimensions;
}

export interface ViewProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: ViewStyle | (ViewStyle | undefined | null | false)[];
  testID?: string;
  onLayout?: (event: LayoutEvent) => void;
}

export const View: React.FC<ViewProps> = ({
  style,
  children,
  testID,
  onLayout: _onLayout,
  ...props
}) => {
  const flattened = StyleSheet.flatten(style);
  return (
    <div
      data-testid={testID}
      style={{
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        position: 'relative',
        borderWidth: 0,
        borderStyle: 'solid',
        ...flattened,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export interface SafeAreaViewProps extends ViewProps {}

export const SafeAreaView: React.FC<SafeAreaViewProps> = ({ style, children, ...props }) => {
  const flattened = StyleSheet.flatten(style);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        flex: 1,
        paddingTop: 'env(safe-area-inset-top, 20px)',
        paddingBottom: 'env(safe-area-inset-bottom, 20px)',
        ...flattened,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export interface TextProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'style'> {
  style?: TextStyle | (TextStyle | undefined | null | false)[];
  numberOfLines?: number;
  testID?: string;
}

export const Text: React.FC<TextProps> = ({ style, children, numberOfLines, testID, ...props }) => {
  const flattened = StyleSheet.flatten(style);
  const clampStyle: React.CSSProperties = numberOfLines
    ? {
        display: '-webkit-box',
        WebkitLineClamp: numberOfLines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }
    : {};

  return (
    <span
      data-testid={testID}
      style={{
        boxSizing: 'border-box',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        ...clampStyle,
        ...flattened,
      }}
      {...props}
    >
      {children}
    </span>
  );
};

export interface TouchableOpacityProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'style'
> {
  style?: ViewStyle | (ViewStyle | undefined | null | false)[];
  onPress?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  activeOpacity?: number;
  disabled?: boolean;
  testID?: string;
}

export const TouchableOpacity: React.FC<TouchableOpacityProps> = ({
  style,
  onPress,
  children,
  activeOpacity: _activeOpacity = 0.7,
  disabled,
  testID,
  ...props
}) => {
  const flattened = StyleSheet.flatten(style);
  return (
    <button
      data-testid={testID}
      onClick={disabled ? undefined : onPress}
      disabled={disabled}
      style={{
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        background: 'none',
        border: 'none',
        padding: 0,
        margin: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        textAlign: 'inherit',
        ...flattened,
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export const Pressable = TouchableOpacity;

export interface ScrollViewProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: ViewStyle | (ViewStyle | undefined | null | false)[];
  contentContainerStyle?: ViewStyle | (ViewStyle | undefined | null | false)[];
  horizontal?: boolean;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
}

export const ScrollView: React.FC<ScrollViewProps> = ({
  style,
  contentContainerStyle,
  children,
  horizontal,
  showsVerticalScrollIndicator: _showsVerticalScrollIndicator,
  showsHorizontalScrollIndicator: _showsHorizontalScrollIndicator,
  ...props
}) => {
  const flattened = StyleSheet.flatten(style);
  const contentFlattened = StyleSheet.flatten(contentContainerStyle);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: horizontal ? 'row' : 'column',
        overflowX: horizontal ? 'auto' : 'hidden',
        overflowY: horizontal ? 'hidden' : 'auto',
        boxSizing: 'border-box',
        flex: 1,
        ...flattened,
      }}
      {...props}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: horizontal ? 'row' : 'column',
          boxSizing: 'border-box',
          ...contentFlattened,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export interface FlatListProps<T = unknown> {
  data?: readonly T[] | null;
  renderItem?: (info: { item: T; index: number }) => React.ReactElement | null;
  keyExtractor?: (item: T, index: number) => string;
  ListHeaderComponent?: React.ReactNode | React.ComponentType;
  ListEmptyComponent?: React.ReactNode | React.ComponentType;
  style?: ViewStyle | (ViewStyle | undefined | null | false)[];
  contentContainerStyle?: ViewStyle | (ViewStyle | undefined | null | false)[];
  horizontal?: boolean;
}

export function FlatList<T = unknown>({
  data = [],
  renderItem,
  keyExtractor = (_item: T, idx: number) => String(idx),
  ListHeaderComponent,
  ListEmptyComponent,
  style,
  contentContainerStyle,
  horizontal,
}: FlatListProps<T>): React.ReactElement {
  const flattened = StyleSheet.flatten(style);
  const contentFlattened = StyleSheet.flatten(contentContainerStyle);
  const safeData = data || [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: horizontal ? 'row' : 'column',
        overflowX: horizontal ? 'auto' : 'hidden',
        overflowY: horizontal ? 'hidden' : 'auto',
        boxSizing: 'border-box',
        flex: 1,
        ...flattened,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: horizontal ? 'row' : 'column',
          boxSizing: 'border-box',
          ...contentFlattened,
        }}
      >
        {ListHeaderComponent &&
          (React.isValidElement(ListHeaderComponent)
            ? ListHeaderComponent
            : typeof ListHeaderComponent === 'function'
              ? React.createElement(ListHeaderComponent as React.ComponentType)
              : (ListHeaderComponent as React.ReactNode))}
        {safeData.length === 0 &&
          ListEmptyComponent &&
          (React.isValidElement(ListEmptyComponent)
            ? ListEmptyComponent
            : typeof ListEmptyComponent === 'function'
              ? React.createElement(ListEmptyComponent as React.ComponentType)
              : (ListEmptyComponent as React.ReactNode))}
        {renderItem &&
          safeData.map((item: T, index: number) => {
            const key = keyExtractor(item, index);
            return <React.Fragment key={key}>{renderItem({ item, index })}</React.Fragment>;
          })}
      </div>
    </div>
  );
}

export interface StatusBarProps {
  barStyle?: string;
  backgroundColor?: string;
  translucent?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = () => null;

export interface ActivityIndicatorProps {
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle | (ViewStyle | undefined | null | false)[];
}

export const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
  size = 'small',
  color = '#3b82f6',
  style,
}) => {
  const flattened = StyleSheet.flatten(style);
  const dim = size === 'large' ? 36 : 20;
  return (
    <div
      style={{
        display: 'inline-block',
        width: dim,
        height: dim,
        borderRadius: '50%',
        border: `2px solid ${color}33`,
        borderTopColor: color,
        animation: 'spin 0.8s linear infinite',
        ...flattened,
      }}
    />
  );
};

export interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'style'> {
  source?: string | { uri: string };
  style?: ImageStyle | (ImageStyle | undefined | null | false)[];
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  testID?: string;
}

export const Image: React.FC<ImageProps> = ({
  source,
  style,
  resizeMode = 'cover',
  testID,
  ...props
}) => {
  const flattened = StyleSheet.flatten(style);
  const uri = typeof source === 'string' ? source : source?.uri;
  const objectFitVal: React.CSSProperties['objectFit'] =
    resizeMode === 'center' || resizeMode === 'contain'
      ? 'contain'
      : resizeMode === 'stretch'
        ? 'fill'
        : 'cover';

  return (
    <img
      data-testid={testID}
      src={uri}
      style={{
        objectFit: objectFitVal,
        ...flattened,
      }}
      {...props}
    />
  );
};
