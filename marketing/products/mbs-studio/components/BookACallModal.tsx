"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

interface BookACallModalProps {
  open: boolean;
  onClose: () => void;
}

const inputClass =
  "w-full rounded-none border-0 bg-[#E8E8E8] px-4 py-3 text-[15px] font-normal text-black placeholder:text-black/45 outline-none focus:ring-1 focus:ring-black/15";

export default function BookACallModal({ open, onClose }: BookACallModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-[200] m-auto w-[min(94vw,1000px)] max-w-none border-0 bg-white p-0 shadow-[0_8px_40px_rgba(0,0,0,0.12)] backdrop:bg-black/25 backdrop:backdrop-blur-[3px] open:block"
      data-no-draw
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-5 right-5 z-10 text-[28px] leading-none font-light text-black/60 transition-opacity hover:text-black"
        aria-label="Close"
        data-no-draw
      >
        ×
      </button>

      <div className="flex flex-col md:flex-row">
        {/* Form — left column */}
        <div className="flex flex-1 flex-col px-8 py-10 md:px-10 md:py-12 lg:px-12">
          <h2 className="mb-8 text-[22px] font-medium text-black md:text-[24px]">
            Get a call with us!
          </h2>

          <form
            className="flex flex-1 flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              onClose();
            }}
            data-no-draw
          >
            <input
              required
              type="text"
              name="fullName"
              placeholder="Full name"
              className={inputClass}
              data-no-draw
            />
            <input
              required
              type="email"
              name="email"
              placeholder="E-mail"
              className={inputClass}
              data-no-draw
            />
            <input
              type="text"
              name="services"
              placeholder="Service(s) you need"
              className={inputClass}
              data-no-draw
            />
            <textarea
              name="message"
              rows={5}
              placeholder="Anything you want us to know"
              className={`${inputClass} min-h-[120px] resize-none`}
              data-no-draw
            />

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="h-[44px] min-w-[100px] rounded-full bg-black px-8 text-[15px] font-medium text-white transition-opacity hover:opacity-85"
                data-no-draw
              >
                Send
              </button>
            </div>
          </form>
        </div>

        {/* Telephone illustration — right column (Figma sketch) */}
        <div className="relative flex w-full shrink-0 items-center justify-center bg-white px-6 pb-8 md:w-[42%] md:px-0 md:pb-0 md:pr-8">
          <Image
            src="/modal/telephone.svg"
            alt=""
            width={530}
            height={451}
            className="h-auto w-full max-w-[min(80vw,400px)] object-contain md:max-w-[380px]"
            data-no-draw
            priority
            unoptimized
          />
        </div>
      </div>
    </dialog>
  );
}
