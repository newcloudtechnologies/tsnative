{
    let i = 0;
    let randoms: Set<Number> = new Set;
    const COUNT = 100;
    for (i = 0; i < COUNT; ++i) {
        const nextRand = Math.random();
        console.assert(0 <= nextRand && nextRand < 1, "Math: random generated number outside [0, 1)");
        randoms.add(Math.random());
    }
    i = 0;
    console.assert(randoms.size === COUNT, "Math: random generated non unique numbers");
}