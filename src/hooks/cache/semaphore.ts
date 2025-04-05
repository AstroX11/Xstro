export class Semaphore {
  private current: number;
  private readonly max: number;
  private queue: (() => void)[] = [];

  constructor(max: number) {
    this.current = 0;
    this.max = max;
  }

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    if (this.current > 0) {
      this.current--;
    }
    const next = this.queue.shift();
    if (next) {
      this.current++;
      next();
    }
  }
}

