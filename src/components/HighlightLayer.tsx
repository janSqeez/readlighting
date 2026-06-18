import { useEffect, useRef, useState } from 'react';
import { Button, FlexBox, Icon } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/palette.js';
import type { HighlightColor, ColorPickerState } from '../types';
import { getTextOffsets } from '../services/highlighter';

const COLORS: HighlightColor[] = ['yellow', 'green', 'blue', 'pink', 'orange'];

const COLOR_STYLES: Record<HighlightColor, string> = {
  yellow: '#FFEB3B',
  green: '#4CAF50',
  blue: '#2196F3',
  pink: '#E91E63',
  orange: '#FF9800',
};

interface HighlightLayerProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onHighlight: (start: number, end: number, text: string, color: HighlightColor) => void;
  onHighlightClick: (highlightId: string) => void;
}

export function HighlightLayer({ containerRef, onHighlight, onHighlightClick }: HighlightLayerProps) {
  const [picker, setPicker] = useState<ColorPickerState | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseUp(e: MouseEvent) {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();
      if (!selectedText) return;

      if (!containerRef.current?.contains(range.commonAncestorContainer)) return;

      const offsets = getTextOffsets(containerRef.current, range);
      if (!offsets || offsets.start === offsets.end) return;

      setPicker({
        visible: true,
        x: e.clientX,
        y: e.clientY - 50,
        rangeStart: offsets.start,
        rangeEnd: offsets.end,
        selectedText,
      });
    }

    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPicker(null);
      }
    }

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [containerRef]);

  useEffect(() => {
    function handleHighlightClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const mark = target.closest('mark[data-highlight-id]');
      if (mark) {
        const id = mark.getAttribute('data-highlight-id');
        if (id) {
          e.stopPropagation();
          onHighlightClick(id);
        }
      }
    }

    const container = containerRef.current;
    container?.addEventListener('click', handleHighlightClick);
    return () => container?.removeEventListener('click', handleHighlightClick);
  }, [containerRef, onHighlightClick]);

  function selectColor(color: HighlightColor) {
    if (!picker) return;
    onHighlight(picker.rangeStart, picker.rangeEnd, picker.selectedText, color);
    window.getSelection()?.removeAllRanges();
    setPicker(null);
  }

  if (!picker) return null;

  const viewportWidth = window.innerWidth;
  const pickerWidth = 220;
  let x = picker.x - pickerWidth / 2;
  if (x < 8) x = 8;
  if (x + pickerWidth > viewportWidth - 8) x = viewportWidth - pickerWidth - 8;

  return (
    <div
      ref={pickerRef}
      className="color-picker-popup"
      style={{ left: x, top: Math.max(8, picker.y) }}
    >
      <div className="color-picker-label">
        <Icon name="palette" style={{ marginRight: '4px' }} />
        <span>Highlight color</span>
      </div>
      <FlexBox gap="6px" style={{ marginTop: '8px' }}>
        {COLORS.map((color) => (
          <button
            key={color}
            className="color-swatch"
            style={{ background: COLOR_STYLES[color] }}
            title={color}
            onClick={() => selectColor(color)}
          />
        ))}
      </FlexBox>
      <Button
        design="Transparent"
        style={{ marginTop: '6px', width: '100%', fontSize: '12px' }}
        onClick={() => { setPicker(null); window.getSelection()?.removeAllRanges(); }}
      >
        Cancel
      </Button>
    </div>
  );
}
