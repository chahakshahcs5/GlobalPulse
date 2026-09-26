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
};

export type TextStyle = ViewStyle & {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  lineHeight?: number;
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
};

export type ImageStyle = ViewStyle & {
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
};

export const StyleSheet = {
  create: <T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(styles: T): T => styles,
  flatten: (style: any) => (Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style || {}),
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

export const View: React.FC<any> = ({ style, children, testID, onLayout, ...props }) => {
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

export const SafeAreaView: React.FC<any> = ({ style, children, ...props }) => {
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

export const Text: React.FC<any> = ({ style, children, numberOfLines, testID, ...props }) => {
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

export const TouchableOpacity: React.FC<any> = ({
  style,
  onPress,
  children,
  activeOpacity = 0.7,
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

export const Pressable: React.FC<any> = TouchableOpacity;

export const ScrollView: React.FC<any> = ({
  style,
  contentContainerStyle,
  children,
  horizontal,
  showsVerticalScrollIndicator,
  showsHorizontalScrollIndicator,
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

export const FlatList: React.FC<any> = ({
  data = [],
  renderItem,
  keyExtractor = (_item: any, idx: number) => String(idx),
  ListHeaderComponent,
  ListEmptyComponent,
  style,
  contentContainerStyle,
  horizontal,
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
    >
      <div
        style={{
          display: 'flex',
          flexDirection: horizontal ? 'row' : 'column',
          boxSizing: 'border-box',
          ...contentFlattened,
        }}
      >
        {ListHeaderComponent && (
          typeof ListHeaderComponent === 'function' ? ListHeaderComponent() : ListHeaderComponent
        )}
        {data.length === 0 && ListEmptyComponent && (
          typeof ListEmptyComponent === 'function' ? ListEmptyComponent() : ListEmptyComponent
        )}
        {data.map((item: any, index: number) => {
          const key = keyExtractor(item, index);
          return (
            <React.Fragment key={key}>
              {renderItem({ item, index })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export const StatusBar: React.FC<any> = () => null;

export const ActivityIndicator: React.FC<any> = ({ size = 'small', color = '#3b82f6', style }) => {
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

export const Image: React.FC<any> = ({ source, style, resizeMode = 'cover', testID, ...props }) => {
  const flattened = StyleSheet.flatten(style);
  const uri = typeof source === 'string' ? source : source?.uri;
  return (
    <img
      data-testid={testID}
      src={uri}
      style={{
        objectFit: resizeMode,
        ...flattened,
      }}
      {...props}
    />
  );
};
