import { Component, type ErrorInfo, type ReactNode } from 'react';

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in Image Splitter', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-crash-screen" role="alert">
          <h1>문제가 발생했어요</h1>
          <p>예상치 못한 오류로 화면을 표시할 수 없어요. 새로고침하면 대부분 해결돼요.</p>
          <button type="button" className="export-button" onClick={() => window.location.reload()}>
            새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
