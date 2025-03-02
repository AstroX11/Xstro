FROM quay.io/astrox11/xstro:latest
RUN git clone https://github.com/AstroX11/Xstro /Xstro
WORKDIR /Xstro
RUN yarn install && yarn run build
CMD ["npm", "start"]
