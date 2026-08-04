/**
 * Regression Test Suite: useDebounce Hook
 * 
 * Ensures the debounce hook works correctly for search inputs.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../hooks/useDebounce';

describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('hello', 500));
        expect(result.current).toBe('hello');
    });

    it('does not update value before delay', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'hello', delay: 500 } }
        );

        rerender({ value: 'world', delay: 500 });
        act(() => { vi.advanceTimersByTime(200); });
        expect(result.current).toBe('hello');
    });

    it('updates value after delay', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'hello', delay: 500 } }
        );

        rerender({ value: 'world', delay: 500 });
        act(() => { vi.advanceTimersByTime(500); });
        expect(result.current).toBe('world');
    });

    it('resets timer on rapid value changes', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'a', delay: 300 } }
        );

        rerender({ value: 'ab', delay: 300 });
        act(() => { vi.advanceTimersByTime(100); });

        rerender({ value: 'abc', delay: 300 });
        act(() => { vi.advanceTimersByTime(100); });

        rerender({ value: 'abcd', delay: 300 });
        act(() => { vi.advanceTimersByTime(100); });

        // Only 100ms after last change, should still be 'a'
        expect(result.current).toBe('a');

        // After full delay from last change
        act(() => { vi.advanceTimersByTime(200); });
        expect(result.current).toBe('abcd');
    });

    it('works with numeric values', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 0, delay: 200 } }
        );

        rerender({ value: 42, delay: 200 });
        act(() => { vi.advanceTimersByTime(200); });
        expect(result.current).toBe(42);
    });
});
