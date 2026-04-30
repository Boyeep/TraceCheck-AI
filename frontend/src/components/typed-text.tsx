import { useEffect, useRef, useState } from "react";

type TypedTextElement = "div" | "p" | "span";

type TypedTextProps = {
  as?: TypedTextElement;
  className?: string;
  cursor?: boolean;
  startDelay?: number;
  text: string;
  typingSpeed?: number;
};

const getTypingDelay = (character: string, typingSpeed: number) => {
  if (character === "." || character === "!" || character === "?") {
    return typingSpeed * 5;
  }

  if (character === "," || character === ";") {
    return typingSpeed * 3;
  }

  if (character === " ") {
    return Math.max(typingSpeed * 0.45, 14);
  }

  return typingSpeed;
};

export const TypedText = ({
  as = "p",
  className,
  cursor = false,
  startDelay = 0,
  text,
  typingSpeed = 14,
}: TypedTextProps) => {
  const elementRef = useRef<HTMLElement | null>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setDisplayedText("");
    setHasAnimated(false);
    setIsTyping(false);
  }, [text]);

  useEffect(() => {
    const node = elementRef.current;

    if (!node) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.18,
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayedText(text);
      setHasAnimated(true);
      setIsTyping(false);
      return;
    }

    if (hasAnimated) {
      setDisplayedText(text);
      return;
    }

    let isCancelled = false;
    let timeoutId = 0;
    let index = 0;

    setDisplayedText("");
    setIsTyping(true);

    const typeNextCharacter = () => {
      if (isCancelled) {
        return;
      }

      index += 1;
      setDisplayedText(text.slice(0, index));

      if (index >= text.length) {
        setIsTyping(false);
        setHasAnimated(true);
        return;
      }

      timeoutId = window.setTimeout(
        typeNextCharacter,
        getTypingDelay(text.charAt(index), typingSpeed),
      );
    };

    timeoutId = window.setTimeout(typeNextCharacter, startDelay);

    return () => {
      isCancelled = true;
      setIsTyping(false);
      window.clearTimeout(timeoutId);
    };
  }, [hasAnimated, isVisible, startDelay, text, typingSpeed]);

  const Component = as;

  return (
    <Component
      className={["typed-text", className].filter(Boolean).join(" ")}
      ref={(node) => {
        elementRef.current = node;
      }}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="typed-text-ghost">
        {text}
      </span>
      <span
        aria-hidden="true"
        className={[
          "typed-text-live",
          cursor && isTyping ? "is-typing" : "",
        ].filter(Boolean).join(" ")}
      >
        {displayedText}
      </span>
    </Component>
  );
};
