import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallbackTitle?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 my-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-center max-w-lg mx-auto shadow-lg backdrop-blur-md">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mx-auto mb-3 text-red-600 dark:text-red-400">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-base font-bold text-red-700 dark:text-red-300 mb-1">
                        {this.props.fallbackTitle || 'ಪುಟವನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ'}
                    </h3>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80 mb-4 font-mono">
                        {this.state.error?.message || 'ಅನಿರೀಕ್ಷಿತ ದೋಷ ಸಂಭವಿಸಿದೆ'}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                    >
                        <RefreshCw size={14} />
                        ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
