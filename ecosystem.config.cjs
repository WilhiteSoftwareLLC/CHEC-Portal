module.exports = {
    apps: [
        {
            name: 'CHEC-Portal',
            script: 'dist/index.js',
            time: true,
            instances: 1,
            autorestart: true,
            max_restarts: 5,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
            },
        },
    ],

    deploy: {
        production: {
            user: 'jeff',
            host: 'chec.wilhite.software',
            key: 'deploy.key',
            ref: 'origin/main',
            repo: 'https://github.com/WilhiteSoftwareLLC/CHEC-Portal.git',
            path: '/home/jeff/Development/CHEC-Portal',
            'pre-deploy-local': 'scp -i deploy.key env/.env jeff@chec.wilhite.software:/home/jeff/Development/CHEC-Portal/current/.env',
            'post-deploy': 'npm install && npm run build && pm2 startOrRestart ecosystem.config.cjs',
            'pre-setup': '',
        },
    },
}
