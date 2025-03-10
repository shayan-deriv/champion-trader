import { useState, useRef, useEffect } from "react";
import { useTradeStore } from "@/stores/tradeStore";
import { useClientStore } from "@/stores/clientStore";
import { incrementStake, decrementStake, parseStakeAmount, STAKE_CONFIG } from "@/config/stake";
import { useBottomSheetStore } from "@/stores/bottomSheetStore";
import { useTooltipStore } from "@/stores/tooltipStore";
import { validateStake } from "../utils/validation";

interface UseStakeFieldProps {
  onSelect?: (isSelected: boolean) => void;
  onError?: (error: boolean) => void;
}

export const useStakeField = ({ onSelect, onError }: UseStakeFieldProps) => {
  const { stake, setStake } = useTradeStore();
  const { currency } = useClientStore();
  const { setBottomSheet } = useBottomSheetStore();
  const { showTooltip, hideTooltip } = useTooltipStore();
  const [isSelected, setIsSelected] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [localValue, setLocalValue] = useState(stake);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalValue(stake);
  }, [stake]);

  const showError = (message: string) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      showTooltip(message, { x: rect.left-8 , y: rect.top + rect.height / 2 }, "error");
    }
  };

  const validateAndUpdateStake = (value: string) => {
    // Always validate empty field or zero as error
    if (!value || value === "0") {
      setError(true);
      const message = "Please enter an amount";
      setErrorMessage(message);
      showError(message);
      onError?.(true);
      return false;
    }

    const amount = parseStakeAmount(value);
    const validation = validateStake({
      amount,
      minStake: STAKE_CONFIG.min,
      maxPayout: STAKE_CONFIG.max,
      currency,
    });

    setError(validation.error);
    setErrorMessage(validation.message);
    if (validation.error && validation.message) {
      showError(validation.message);
    }
    onError?.(validation.error);
    return !validation.error;
  };

  const handleIncrement = () => {
    const newValue = incrementStake(stake || "0");
    if (validateAndUpdateStake(newValue)) {
      setStake(newValue);
      hideTooltip();
    }
  };

  const handleDecrement = () => {
    const newValue = decrementStake(stake || "0");
    if (validateAndUpdateStake(newValue)) {
      setStake(newValue);
      hideTooltip();
    }
  };

  const handleSelect = (selected: boolean) => {
    setIsSelected(selected);
    onSelect?.(selected);
    
    // Show error tooltip if there's an error
    if (error && errorMessage) {
      showError(errorMessage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get cursor position before update
    const cursorPosition = e.target.selectionStart;
    
    // Extract only the number part
    let value = e.target.value;
    
    // If backspace was pressed and we're at the currency part, ignore it
    if (value.length < localValue.length && value.endsWith(currency)) {
      return;
    }
    
    // Remove currency and any non-numeric characters except decimal point
    value = value.replace(new RegExp(`\\s*${currency}$`), '').trim();
    value = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }

    // Remove leading zeros unless it's just "0"
    if (value !== "0") {
      value = value.replace(/^0+/, '');
    }

    // If it starts with a decimal, add leading zero
    if (value.startsWith('.')) {
      value = '0' + value;
    }

    setLocalValue(value);

    if (value === "") {
      setError(true);
      const message = "Please enter an amount";
      setErrorMessage(message);
      showError(message);
      onError?.(true);
      setStake("0");
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      if (validateAndUpdateStake(value)) {
        setStake(value);
        hideTooltip();
      }
      
      // Restore cursor position after React updates the input
      setTimeout(() => {
        if (inputRef.current && cursorPosition !== null) {
          inputRef.current.selectionStart = cursorPosition;
          inputRef.current.selectionEnd = cursorPosition;
        }
      }, 0);
    }
  };

  const handleMobileClick = () => {
    setBottomSheet(true, "stake", "400px");
  };

  return {
    stake,
    currency,
    isSelected,
    error,
    errorMessage,
    localValue,
    inputRef,
    containerRef,
    handleSelect,
    handleChange,
    handleIncrement,
    handleDecrement,
    handleMobileClick,
  };
};
